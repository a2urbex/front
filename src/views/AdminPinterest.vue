<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue'
import { toast } from 'vue3-toastify'

import Title from '@/components/Title.vue'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/services/api'

const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE_URL
const ADMIN_ENDPOINT = '/admin/pinterest'
const ADMIN_SOURCES = '/admin/sources'

const jobId = ref(null)
const uiError = ref(null)

const stats = ref({
  state: 'idle',
  processed: 0,
  inserted: 0,
  skipped: 0,
  failed: 0,
  speed: 0,
})

// Settings
const sources = ref([])
const settings = ref({ cron_enabled: 1, cron_expression: '0 3 * * *', source_id: null })
const savingSettings = ref(false)

// Live terminal log
const logLines = ref([])
const terminalEl = ref(null)
const MAX_LOG_LINES = 1000

const es = shallowRef(null)
let reconnectTimer = null
let reconnectAttempts = 0

function pushLog(line) {
  logLines.value.push(line)
  if (logLines.value.length > MAX_LOG_LINES) {
    logLines.value.splice(0, logLines.value.length - MAX_LOG_LINES)
  }
  nextTick(() => {
    const el = terminalEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const history = ref([])
const historyLoading = ref(false)

const isRunning = computed(() => stats.value.state === 'running')
const isTerminal = computed(() => ['finished', 'stopped', 'error'].includes(stats.value.state))

async function loadSources() {
  try {
    const data = await request('GET', ADMIN_SOURCES)
    sources.value = data?.list ?? []
  } catch (e) {
    console.error('Failed to load sources', e)
  }
}

async function loadOverview() {
  historyLoading.value = true
  try {
    const data = await request('GET', ADMIN_ENDPOINT)
    history.value = data?.list ?? []
    if (data?.settings) {
      settings.value = {
        cron_enabled: Number(data.settings.cron_enabled) === 1 ? 1 : 0,
        cron_expression: data.settings.cron_expression ?? '0 3 * * *',
        source_id: data.settings.source_id ?? null,
      }
    }
    // If the server reports a run in progress but we are not tracking it,
    // reflect the running state (without a live stream we cannot attach).
    if (data?.running && stats.value.state === 'idle') {
      stats.value = { ...stats.value, state: 'running' }
    }
  } catch (e) {
    console.error('Failed to load Pinterest overview', e)
  } finally {
    historyLoading.value = false
  }
}

// Refresh history whenever a job reaches a terminal state.
watch(
  () => stats.value.state,
  (state) => {
    if (['finished', 'stopped', 'error'].includes(state)) loadOverview()
  }
)

onMounted(async () => {
  await Promise.all([loadSources(), loadOverview()])
})

function fmtNumber(n) {
  return Number(n ?? 0).toLocaleString()
}

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDuration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${ms} ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function closeStream() {
  es.value?.close()
  es.value = null
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function connect(id) {
  closeStream()
  // Replayed buffer arrives on (re)connect — reset to avoid duplicates.
  logLines.value = []
  const url = `${API_BASE}${ADMIN_ENDPOINT}/${id}/stream?token=${encodeURIComponent(authStore.token || '')}`
  const source = new EventSource(url)
  es.value = source

  source.addEventListener('stats', (e) => {
    reconnectAttempts = 0
    try {
      stats.value = JSON.parse(e.data)
      if (isTerminal.value) closeStream()
    } catch (err) {
      console.error('Invalid SSE payload', err)
    }
  })

  source.addEventListener('log', (e) => {
    pushLog(e.data)
  })

  source.onerror = () => {
    if (isTerminal.value) {
      closeStream()
      return
    }
    closeStream()
    reconnectAttempts++
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 10000)
    reconnectTimer = setTimeout(() => connect(id), delay)
  }
}

async function start() {
  uiError.value = null
  try {
    const data = await request('POST', `${ADMIN_ENDPOINT}/run`)
    jobId.value = data.id
    stats.value = {
      state: 'running',
      processed: 0,
      inserted: 0,
      skipped: 0,
      failed: 0,
      speed: 0,
    }
    connect(data.id)
    toast.success(`Pinterest import started (source: ${data.source})`, {
      position: toast.POSITION.TOP_CENTER, autoClose: 1500, theme: 'dark',
    })
  } catch (e) {
    uiError.value = e?.message ?? String(e)
  }
}

async function stop() {
  if (!jobId.value) return
  try {
    await request('POST', `${ADMIN_ENDPOINT}/${jobId.value}/stop`)
  } catch (e) {
    uiError.value = e?.message ?? String(e)
  }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    const updated = await request('PATCH', `${ADMIN_ENDPOINT}/settings`, {
      cronEnabled: Number(settings.value.cron_enabled) === 1,
      cronExpression: settings.value.cron_expression,
      sourceId: settings.value.source_id === '' ? null : settings.value.source_id,
    })
    if (updated) {
      settings.value = {
        cron_enabled: Number(updated.cron_enabled) === 1 ? 1 : 0,
        cron_expression: updated.cron_expression ?? '0 3 * * *',
        source_id: updated.source_id ?? null,
      }
    }
    toast.success('Settings saved', { theme: 'dark', autoClose: 1500 })
  } catch (e) {
    toast.error(e?.message || 'Could not save settings')
  } finally {
    savingSettings.value = false
  }
}

async function deleteHistoryItem(id) {
  try {
    await request('DELETE', `${ADMIN_ENDPOINT}/${id}`)
    history.value = history.value.filter((j) => j.id !== id)
  } catch (e) {
    toast.error(e?.message || 'Could not delete entry')
  }
}

onUnmounted(closeStream)
</script>

<template>
  <Title title="Pinterest Manager" />

  <div class="admin-pinterest page-width">
    <header class="admin-pinterest__header">
      <div>
        <h2>Pinterest Manager</h2>
        <p>
          Run and monitor the Pinterest board import. Each run scrapes the configured
          board and imports new pins as location points, attributed to the chosen source.
        </p>
      </div>
      <span class="admin-pinterest__badge" :data-state="stats.state">{{ stats.state }}</span>
    </header>

    <!-- Run / live progress -->
    <section class="admin-pinterest__panel">
      <div class="admin-pinterest__controls">
        <div class="admin-pinterest__actions">
          <button class="btn btn--primary" :disabled="isRunning" @click="start">
            Run import
          </button>
          <button class="btn btn--danger" :disabled="!isRunning" @click="stop">
            Stop
          </button>
        </div>
      </div>

      <dl class="admin-pinterest__stats">
        <div class="stat">
          <dt>Processed</dt>
          <dd><strong>{{ fmtNumber(stats.processed) }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Inserted</dt>
          <dd><strong class="success">{{ fmtNumber(stats.inserted) }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Skipped</dt>
          <dd><strong>{{ fmtNumber(stats.skipped) }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Failed</dt>
          <dd><strong class="danger">{{ fmtNumber(stats.failed) }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Speed</dt>
          <dd><strong>{{ Math.round(stats.speed) }}</strong> <span class="muted">pins/s</span></dd>
        </div>
      </dl>

      <div class="admin-pinterest__terminal-wrap">
        <div class="admin-pinterest__terminal-bar">
          <span class="dot dot--red"></span>
          <span class="dot dot--amber"></span>
          <span class="dot dot--green"></span>
          <span class="admin-pinterest__terminal-title">pinterest — live output</span>
        </div>
        <div class="admin-pinterest__terminal" ref="terminalEl">
          <div v-if="!logLines.length" class="admin-pinterest__terminal-empty">
            Waiting for output… start a run to see live logs.
          </div>
          <div v-for="(line, i) in logLines" :key="i" class="admin-pinterest__terminal-line">
            <span class="prompt">$</span> {{ line }}
          </div>
        </div>
      </div>

      <p v-if="uiError || stats.error" class="admin-pinterest__error">
        {{ uiError ?? stats.error }}
      </p>
    </section>

    <!-- Settings -->
    <section class="admin-pinterest__settings">
      <header class="admin-pinterest__settings-header">
        <h3>Configuration</h3>
      </header>

      <div class="admin-pinterest__settings-grid">
        <label class="admin-pinterest__field admin-pinterest__field--toggle">
          <span>Scheduled cron</span>
          <div class="toggle">
            <input type="checkbox" id="cron-enabled" :checked="settings.cron_enabled === 1"
              @change="settings.cron_enabled = $event.target.checked ? 1 : 0" />
            <label for="cron-enabled">{{ settings.cron_enabled === 1 ? 'Enabled' : 'Disabled' }}</label>
          </div>
        </label>

        <label class="admin-pinterest__field">
          <span>Cron expression</span>
          <input type="text" v-model="settings.cron_expression" placeholder="0 3 * * *" />
        </label>

        <label class="admin-pinterest__field">
          <span>Source for imported points</span>
          <select v-model="settings.source_id">
            <option :value="null">Default (Pinterest)</option>
            <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
      </div>

      <div class="admin-pinterest__settings-actions">
        <button class="btn btn--primary" :disabled="savingSettings" @click="saveSettings">
          Save settings
        </button>
      </div>
    </section>

    <!-- History -->
    <section class="admin-pinterest__history">
      <header class="admin-pinterest__history-header">
        <h3>History</h3>
        <button class="btn btn--ghost" :disabled="historyLoading" @click="loadOverview">
          <font-awesome-icon :icon="['fas', 'rotate-right']" />
          Refresh
        </button>
      </header>

      <div class="admin-pinterest__history-empty" v-if="!historyLoading && !history.length">
        No import has been run yet.
      </div>

      <div class="admin-pinterest__history-table" v-else>
        <div class="row row--head">
          <div>Started</div>
          <div>Trigger</div>
          <div>State</div>
          <div>Source</div>
          <div>Processed</div>
          <div>Inserted</div>
          <div>Skipped</div>
          <div>Failed</div>
          <div>Duration</div>
          <div></div>
        </div>
        <div v-for="job in history" :key="job.id" class="row" :data-state="job.state">
          <div class="cell-date"><span class="muted-mono">{{ fmtDate(job.started_at) }}</span></div>
          <div><span class="trigger-badge">{{ job.trigger_type }}</span></div>
          <div><span class="state-badge" :data-state="job.state">{{ job.state }}</span></div>
          <div>{{ job.source_name || 'Pinterest' }}</div>
          <div>{{ fmtNumber(job.total) }}</div>
          <div class="success">{{ fmtNumber(job.inserted) }}</div>
          <div>{{ fmtNumber(job.skipped) }}</div>
          <div class="danger">{{ fmtNumber(job.failed) }}</div>
          <div>{{ fmtDuration(job.started_at, job.finished_at) }}</div>
          <div class="cell-actions">
            <button class="icon-btn" title="Delete entry" @click="deleteHistoryItem(job.id)">
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
        </div>
      </div>
      <p v-if="history.some(j => j.error)" class="admin-pinterest__history-errors">
        <template v-for="job in history.filter(j => j.error)" :key="job.id">
          <span class="muted-mono">{{ fmtDate(job.started_at) }}</span> — {{ job.error }}<br />
        </template>
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.admin-pinterest {
  padding-top: 2rem;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 0.5rem 0;
    }
    p {
      font-size: 0.92rem;
      color: #888;
      margin: 0;
      max-width: 720px;
      line-height: 1.55;
    }
  }

  &__badge {
    flex-shrink: 0;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;
    border: 1px solid rgba(255, 255, 255, 0.08);

    &[data-state='running']  { background: rgba($primary, 0.12); color: $primary; border-color: rgba($primary, 0.3); }
    &[data-state='finished'] { background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
    &[data-state='stopped']  { background: rgba(248, 113, 113, 0.12); color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
    &[data-state='error']    { background: rgba(248, 113, 113, 0.2);  color: #fca5a5; border-color: rgba(248, 113, 113, 0.5); }
  }

  &__panel,
  &__settings {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__settings-header h3,
  &__history-header h3 {
    margin: 0;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
  }

  &__controls {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  &__actions { display: flex; gap: 0.6rem; }

  &__settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.2rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    span {
      font-size: 0.78rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    input[type='text'],
    select {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #fff;
      padding: 0.6rem 0.8rem;
      font-size: 0.95rem;
      &:focus { outline: none; border-color: rgba($primary, 0.5); }
    }

    .toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      input { width: 18px; height: 18px; accent-color: $primary; }
      label { color: #ccc; font-size: 0.9rem; cursor: pointer; }
    }
  }

  &__settings-actions { display: flex; justify-content: flex-end; }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.8rem;
    margin: 0;

    .stat {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1rem 1.1rem;
      border-radius: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      dt {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #888;
      }
      dd {
        margin: 0;
        font-size: 1.4rem;
        color: #fff;
        font-variant-numeric: tabular-nums;
        strong { font-weight: 600; }
        .muted { color: #666; font-size: 0.9rem; margin-left: 0.3rem; }
        .danger { color: #f87171; }
        .success { color: #34d399; }
      }
    }
  }

  &__error {
    color: #fca5a5;
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.25);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin: 0;
    font-size: 0.9rem;
  }

  &__terminal-wrap {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    overflow: hidden;
    background: #0b0f14;
  }

  &__terminal-bar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.8rem;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
      &--red { background: #ff5f56; }
      &--amber { background: #ffbd2e; }
      &--green { background: #27c93f; }
    }
  }

  &__terminal-title {
    margin-left: 0.5rem;
    font-size: 0.75rem;
    color: #8b98a5;
    font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  }

  &__terminal {
    height: 280px;
    overflow-y: auto;
    padding: 0.8rem 1rem;
    font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
    font-size: 0.82rem;
    line-height: 1.5;
    color: #c8d3de;
    scroll-behavior: smooth;

    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 4px; }
  }

  &__terminal-empty {
    color: #5b6770;
    font-style: italic;
  }

  &__terminal-line {
    white-space: pre-wrap;
    word-break: break-word;
    .prompt { color: #27c93f; margin-right: 0.5rem; user-select: none; }
  }
}

.btn {
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  border: 0;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  &--primary {
    background: $primary;
    color: #fff;
    &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  }
  &--danger {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
    border: 1px solid rgba(248, 113, 113, 0.3);
    &:hover:not(:disabled) { background: rgba(248, 113, 113, 0.25); transform: translateY(-1px); }
  }
  &--ghost {
    background: rgba(255, 255, 255, 0.04);
    color: #ccc;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); color: #fff; }
  }
}

.admin-pinterest__history {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-pinterest__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-pinterest__history-empty {
  color: #888;
  font-size: 0.9rem;
  padding: 1.5rem 0;
  text-align: center;
}

.admin-pinterest__history-errors {
  margin: 0;
  font-size: 0.82rem;
  color: #fca5a5;
  line-height: 1.6;
  .muted-mono { color: #aaa; }
}

.admin-pinterest__history-table {
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;

  .row {
    display: grid;
    grid-template-columns: 1.3fr 0.7fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr 0.8fr 0.4fr;
    gap: 0.5rem;
    padding: 0.7rem 0.75rem;
    border-radius: 8px;
    align-items: center;
    color: #d4d4d4;
    font-variant-numeric: tabular-nums;

    &--head {
      color: #777;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 0.3rem;
    }

    &:not(.row--head):hover { background: rgba(255, 255, 255, 0.03); }

    .danger { color: #f87171; font-weight: 600; }
    .success { color: #34d399; font-weight: 600; }
    .muted-mono { color: #aaa; font-variant-numeric: tabular-nums; }
  }

  .cell-actions { display: flex; justify-content: flex-end; }

  .icon-btn {
    background: transparent;
    border: 0;
    color: #666;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    &:hover { color: #f87171; background: rgba(248, 113, 113, 0.1); }
  }

  .state-badge,
  .trigger-badge {
    display: inline-block;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;
  }

  .state-badge {
    &[data-state='running']  { background: rgba($primary, 0.15); color: $primary; }
    &[data-state='finished'] { background: rgba(52, 211, 153, 0.12); color: #34d399; }
    &[data-state='stopped']  { background: rgba(248, 113, 113, 0.12); color: #f87171; }
    &[data-state='error']    { background: rgba(248, 113, 113, 0.2);  color: #fca5a5; }
  }
}

@media (max-width: 1000px) {
  .admin-pinterest__history-table {
    overflow-x: auto;
    .row {
      grid-template-columns: 140px 90px 100px 120px 90px 90px 90px 80px 90px 50px;
      min-width: 940px;
    }
  }
}

@media (max-width: 768px) {
  .admin-pinterest {
    &__panel, &__settings { padding: 1.25rem; }
    &__controls { flex-direction: column; align-items: stretch; }
    &__actions { width: 100%; button { flex: 1; } }
  }
}
</style>
