<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { toast } from 'vue3-toastify'

import Title from '@/components/Title.vue'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/services/api'

const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE_URL
const ADMIN_ENDPOINT = import.meta.env.VITE_ADMIN_DEDUP_ENDPOINT || '/admin/dedup'

const radius = ref(25)
const jobId = ref(null)
const uiError = ref(null)

const stats = ref({
  state: 'idle',
  total: 0,
  processed: 0,
  duplicates: 0,
  kept: 0,
  progress: 0,
  speed: 0,
})

const es = shallowRef(null)
let reconnectTimer = null
let reconnectAttempts = 0

const history = ref([])
const historyLoading = ref(false)

async function loadHistory() {
  historyLoading.value = true
  try {
    const data = await request('GET', ADMIN_ENDPOINT)
    history.value = data?.list ?? []
  } catch (e) {
    console.error('Failed to load dedup history', e)
  } finally {
    historyLoading.value = false
  }
}

// Refresh history whenever a job reaches a terminal state.
watch(
  () => stats.value.state,
  (state) => {
    if (['finished', 'stopped', 'error'].includes(state)) loadHistory()
  }
)

onMounted(loadHistory)

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

function fmtPercent(part, whole) {
  if (!whole) return '0%'
  return `${((part / whole) * 100).toFixed(1)}%`
}

const isRunning = computed(() => stats.value.state === 'running')
const isTerminal = computed(() => ['finished', 'stopped', 'error'].includes(stats.value.state))
const progressPct = computed(() => (stats.value.progress * 100).toFixed(1))

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
    const data = await request('POST', `${ADMIN_ENDPOINT}/start`, { radius: radius.value })
    jobId.value = data.id
    stats.value = {
      state: 'running',
      total: data.total,
      processed: 0,
      duplicates: 0,
      kept: 0,
      progress: 0,
      speed: 0,
    }
    connect(data.id)
    toast.success(`Cleaning started on ${data.total.toLocaleString()} points`, {
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

onUnmounted(closeStream)
</script>

<template>
  <Title title="Geospatial Deduplication" />

  <div class="admin-dedup page-width">
    <header class="admin-dedup__header">
      <div>
        <h2>Geospatial Deduplication</h2>
        <p>
          Remove location points that are too close to each other. The first point
          encountered in each cluster within the configured radius is kept; the rest
          are soft-deleted (recoverable via <code>dedup_job_id</code>).
        </p>
      </div>
      <span class="admin-dedup__badge" :data-state="stats.state">{{ stats.state }}</span>
    </header>

    <section class="admin-dedup__panel">
      <div class="admin-dedup__controls">
        <label class="admin-dedup__field">
          <span>Radius (meters)</span>
          <input
            type="number"
            v-model.number="radius"
            min="1" max="1000"
            :disabled="isRunning"
          />
        </label>

        <div class="admin-dedup__actions">
          <button
            class="btn btn--primary"
            :disabled="isRunning"
            @click="start"
          >
            <font-awesome-icon :icon="['fas', 'play']" v-if="false" />
            Start cleaning
          </button>
          <button
            class="btn btn--danger"
            :disabled="!isRunning"
            @click="stop"
          >
            Stop cleaning
          </button>
        </div>
      </div>

      <div class="admin-dedup__progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <span class="progress-label">{{ progressPct }}%</span>
      </div>

      <dl class="admin-dedup__stats">
        <div class="stat">
          <dt>Processed</dt>
          <dd>
            <strong>{{ stats.processed.toLocaleString() }}</strong>
            <span class="muted">/ {{ stats.total.toLocaleString() }}</span>
          </dd>
        </div>
        <div class="stat">
          <dt>Kept</dt>
          <dd><strong>{{ stats.kept.toLocaleString() }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Duplicates removed</dt>
          <dd><strong class="danger">{{ stats.duplicates.toLocaleString() }}</strong></dd>
        </div>
        <div class="stat">
          <dt>Speed</dt>
          <dd><strong>{{ Math.round(stats.speed).toLocaleString() }}</strong> <span class="muted">pts/s</span></dd>
        </div>
      </dl>

      <p v-if="uiError || stats.error" class="admin-dedup__error">
        {{ uiError ?? stats.error }}
      </p>
    </section>

    <section class="admin-dedup__history">
      <header class="admin-dedup__history-header">
        <h3>History</h3>
        <button
          class="btn btn--ghost"
          :disabled="historyLoading"
          @click="loadHistory"
        >
          <font-awesome-icon :icon="['fas', 'rotate-right']" />
          Refresh
        </button>
      </header>

      <div class="admin-dedup__history-empty" v-if="!historyLoading && !history.length">
        No cleaning has been run yet.
      </div>

      <div class="admin-dedup__history-table" v-else>
        <div class="row row--head">
          <div>Started</div>
          <div>State</div>
          <div>Radius</div>
          <div>Total</div>
          <div>Kept</div>
          <div>Removed</div>
          <div>%</div>
          <div>Duration</div>
        </div>
        <div
          v-for="job in history"
          :key="job.id"
          class="row"
          :data-state="job.state"
        >
          <div class="cell-date">
            <span class="muted-mono">{{ fmtDate(job.started_at) }}</span>
          </div>
          <div>
            <span class="state-badge" :data-state="job.state">{{ job.state }}</span>
          </div>
          <div>{{ job.radius_m }} m</div>
          <div>{{ fmtNumber(job.total) }}</div>
          <div>{{ fmtNumber(job.kept) }}</div>
          <div class="danger">{{ fmtNumber(job.duplicates) }}</div>
          <div>{{ fmtPercent(job.duplicates, job.total) }}</div>
          <div>{{ fmtDuration(job.started_at, job.finished_at) }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.admin-dedup {
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
      code {
        background: rgba(255, 255, 255, 0.06);
        padding: 0 0.35rem;
        border-radius: 4px;
        font-size: 0.85em;
      }
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

  &__panel {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__controls {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
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
    input {
      width: 140px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #fff;
      padding: 0.6rem 0.8rem;
      font-size: 0.95rem;
      &:focus {
        outline: none;
        border-color: rgba($primary, 0.5);
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }

  &__actions {
    display: flex;
    gap: 0.6rem;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: 1rem;
    .progress-track {
      flex: 1;
      height: 14px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $primary, color.adjust($primary, $lightness: 15%));
      transition: width 0.2s ease;
    }
    .progress-label {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: #fff;
      min-width: 60px;
      text-align: right;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
    &:hover:not(:disabled) {
      background: rgba(248, 113, 113, 0.25);
      transform: translateY(-1px);
    }
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
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
  }
}

.admin-dedup__history {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-dedup__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    margin: 0;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
  }
}

.admin-dedup__history-empty {
  color: #888;
  font-size: 0.9rem;
  padding: 1.5rem 0;
  text-align: center;
}

.admin-dedup__history-table {
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;

  .row {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.6fr 0.9fr 0.9fr 0.9fr 0.6fr 0.8fr;
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

    &:not(.row--head):hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .danger { color: #f87171; font-weight: 600; }
    .muted-mono { color: #aaa; font-variant-numeric: tabular-nums; }
  }

  .state-badge {
    display: inline-block;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;

    &[data-state='running']  { background: rgba($primary, 0.15); color: $primary; }
    &[data-state='finished'] { background: rgba(52, 211, 153, 0.12); color: #34d399; }
    &[data-state='stopped']  { background: rgba(248, 113, 113, 0.12); color: #f87171; }
    &[data-state='error']    { background: rgba(248, 113, 113, 0.2);  color: #fca5a5; }
  }
}

@media (max-width: 900px) {
  .admin-dedup__history-table {
    overflow-x: auto;
    .row { grid-template-columns: 140px 100px 80px 100px 100px 100px 70px 100px; min-width: 800px; }
  }
}

@media (max-width: 768px) {
  .admin-dedup {
    &__panel { padding: 1.25rem; }
    &__controls { flex-direction: column; align-items: stretch; }
    &__actions { width: 100%; button { flex: 1; } }
  }
}
</style>
