<script setup>
import Title from '@/components/Title.vue'
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { toast } from 'vue3-toastify'
import { request } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const authStore = useAuthStore()

const importers = ref([])
const schedule = ref([])
// État par importeur : options saisies, job en cours, logs, flux SSE
const ui = reactive({})
const streams = {}

const STAT_LABELS = {
  seen: 'Seen',
  missingGeoOrImage: 'No coords / image',
  alreadyImported: 'Already imported',
  nearbyExisting: 'Point already nearby',
  invalidNearby: 'Invalid point nearby',
  imageFailed: 'Image failed',
  failed: 'Errors',
}

const load = async () => {
  schedule.value = (await request('GET', '/admin/schedule')) || []
  importers.value = (await request('GET', '/admin/importers')) || []
  for (const imp of importers.value) {
    if (!ui[imp.key]) ui[imp.key] = { args: {}, limit: '', job: null, logs: [] }
    const job = imp.running || imp.last
    if (job && !ui[imp.key].job) ui[imp.key].job = job
    if (imp.running) follow(imp.key, imp.running.id)
  }
}

const follow = (key, id) => {
  streams[key]?.close()
  ui[key].logs = []
  const source = new EventSource(`${API_BASE}/admin/importers/jobs/${id}/stream?token=${encodeURIComponent(authStore.token || '')}`)
  streams[key] = source
  source.addEventListener('log', (e) => {
    ui[key].logs.push(e.data)
    if (ui[key].logs.length > 300) ui[key].logs.shift()
  })
  source.addEventListener('stats', (e) => {
    const s = JSON.parse(e.data)
    ui[key].job = s
    if (s.state !== 'running') {
      source.close()
      delete streams[key]
      if (s.state === 'finished' && !s.dryRun) toast.success(`${s.source}: ${s.stats?.inserted ?? 0} points imported`, { position: toast.POSITION.TOP_CENTER, theme: 'dark' })
      if (s.state === 'error') toast.error(`${s.source}: ${s.error}`, { position: toast.POSITION.TOP_CENTER, autoClose: 5000, theme: 'dark' })
    }
  })
  source.onerror = () => {
    source.close()
    delete streams[key]
  }
}

const run = async (imp, dryRun) => {
  const state = ui[imp.key]
  if (!dryRun && !state.confirming) {
    state.confirming = true
    return
  }
  state.confirming = false
  const { id } = await request('POST', `/admin/importers/${imp.key}/run`, {
    dryRun,
    limit: state.limit ? Number(state.limit) : null,
    args: state.args,
  })
  follow(imp.key, id)
}

const stop = async (imp) => {
  const id = ui[imp.key]?.job?.id
  if (id) await request('POST', `/admin/importers/jobs/${id}/stop`)
}

const isRunning = (key) => ui[key]?.job?.state === 'running'
const fmtTime = (t) => (t ? new Date(t).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '')

onMounted(load)
onBeforeUnmount(() => Object.values(streams).forEach((s) => s.close()))
</script>

<template>
  <Title title="Importers" />
  <div class="importers page-width">
    <p class="importers__intro">
      Open sources with coordinates <b>and</b> an image only. Already imported records, points near an invalid spot and
      places already on the map (≈40 m) are skipped. Start with a <b>dry run</b>: it only counts, nothing is written.
    </p>

    <div class="importers__schedule">
      <span class="importers__schedule-title">Automatic runs</span>
      <p v-if="!schedule.length" class="importers__schedule-off">Disabled on this server (SCHEDULER=off).</p>
      <ul v-else>
        <li v-for="t in schedule" :key="t.key">
          <b>{{ t.label }}</b>
          <time>{{ fmtTime(t.nextRun) }}</time>
          <small v-if="t.last">last: {{ t.last.result }}</small>
        </li>
      </ul>
      <p class="importers__schedule-note">Random time every day (imports 7:00-15:00), dedup at the end of the afternoon after the imports. Reports go to admins only.</p>
    </div>

    <section v-for="imp in importers" :key="imp.key" class="importer" :class="{ 'is-running': isRunning(imp.key) }">
      <header class="importer__head">
        <h3>{{ imp.source }}</h3>
        <span class="importer__state" v-if="ui[imp.key]?.job" :class="`is-${ui[imp.key].job.state}`">
          {{ ui[imp.key].job.dryRun ? 'dry run · ' : '' }}{{ ui[imp.key].job.state }}
          <time>{{ fmtTime(ui[imp.key].job.finishedAt || ui[imp.key].job.startedAt) }}</time>
        </span>
      </header>
      <p class="importer__desc">{{ imp.description }}</p>
      <p v-if="imp.unavailable" class="importer__warn">{{ imp.unavailable }}</p>

      <template v-else>
        <div class="importer__options" v-if="ui[imp.key]">
          <label v-for="o in imp.options" :key="o.key">
            <span>{{ o.label }}</span>
            <input v-model="ui[imp.key].args[o.key]" :placeholder="o.placeholder" :disabled="isRunning(imp.key)" />
          </label>
          <label class="importer__limit">
            <span>Limit</span>
            <input v-model="ui[imp.key].limit" type="number" min="1" placeholder="none" :disabled="isRunning(imp.key)" />
          </label>
        </div>

        <div class="importer__actions" v-if="ui[imp.key]">
          <template v-if="!isRunning(imp.key)">
            <button class="btn-ghost" @click="run(imp, true)">Dry run</button>
            <button class="btn-main" @click="run(imp, false)">{{ ui[imp.key].confirming ? 'Confirm import' : 'Import' }}</button>
            <button v-if="ui[imp.key].confirming" class="btn-link" @click="ui[imp.key].confirming = false">Cancel</button>
          </template>
          <button v-else class="btn-ghost" @click="stop(imp)">Stop</button>
        </div>
      </template>

      <dl class="importer__stats" v-if="ui[imp.key]?.job?.stats">
        <div class="is-main">
          <dt>{{ ui[imp.key].job.dryRun ? 'Would import' : 'Imported' }}</dt>
          <dd>{{ ui[imp.key].job.dryRun ? ui[imp.key].job.stats.wouldInsert : ui[imp.key].job.stats.inserted }}</dd>
        </div>
        <div v-for="(label, k) in STAT_LABELS" :key="k" v-show="ui[imp.key].job.stats[k]">
          <dt>{{ label }}</dt>
          <dd>{{ ui[imp.key].job.stats[k] }}</dd>
        </div>
      </dl>

      <pre class="importer__log" v-if="ui[imp.key]?.logs.length">{{ ui[imp.key].logs.join('\n') }}</pre>
    </section>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
.importers {
  max-width: 860px;
  padding-block: 20px 40px;
  &__schedule { margin: 0 0 20px; padding: 14px 16px; background: #111; border: 1px solid #262626;
    ul { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 8px 0 6px; padding: 0; list-style: none; }
    li { display: flex; gap: 8px; align-items: baseline; font-size: 13px; }
    b { color: #e8e4dc; font-weight: 600; }
    time { font: 600 13px $font-body; color: $primary; }
    small { font: 400 12px $font-body; color: $label-2; } }
  &__schedule-title { font: 400 13px $font-body; color: $label-2; }
  &__schedule-off, &__schedule-note { margin: 4px 0 0; font: 400 13px $font-body; color: $label-2; }
  &__intro { color: #9a958c; font-size: 14px; line-height: 1.5; margin: 0 0 20px; b { color: #e8e4dc; } }
}
.importer {
  margin-bottom: 16px;
  padding: 18px;
  background: #111;
  border: 1px solid #262626;
  border-left: 3px solid #333;
  &.is-running { border-left-color: $primary; }
  &__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap;
    h3 { margin: 0; font-size: 22px; } }
  &__state { font: 600 13px $font-body; color: $label-2;
    time { margin-left: 8px; color: #666; }
    &.is-running { color: $primary; } &.is-finished { color: #7fb069; } &.is-error { color: #e0766b; } }
  &__desc { margin: 6px 0 14px; color: #9a958c; font-size: 14px; }
  &__warn { margin: 0; padding: 10px 12px; background: #1d1311; border-left: 2px solid #e0766b; color: #e0a49b; font: 12px $font-mono; }
  &__options { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 12px;
    label { display: flex; flex-direction: column; gap: 4px; }
    span { font: 400 13px $font-body; color: $label-2; }
    input { padding: 9px 10px; background: #1a1a1a; border: 1px solid #2e2e2e; color: #eee; font: inherit; } }
  &__limit { max-width: 140px; }
  &__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    button { padding: 10px 16px; font-weight: 700; cursor: pointer; }
    .btn-main { border: 0; background: $primary; color: #111; text-transform: uppercase; letter-spacing: .04em; }
    .btn-ghost { background: none; border: 1px solid #3a3a3a; color: #ddd; }
    .btn-link { background: none; border: 0; color: #888; text-decoration: underline; font-weight: 400; } }
  &__stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0;
    div { padding: 8px 10px; background: #161616; border: 1px solid #242424; min-width: 96px; }
    .is-main { border-color: $primary; dd { color: $primary; } }
    dt { font: 500 10px $font-mono; text-transform: uppercase; letter-spacing: .06em; color: #777; }
    dd { margin: 2px 0 0; font: 600 18px $font-mono; color: #e8e4dc; } }
  &__log { margin: 12px 0 0; max-height: 260px; overflow: auto; padding: 10px; background: #0a0a0a; border: 1px solid #1f1f1f;
    color: #a9a49a; font: 11px/1.5 $font-mono; white-space: pre-wrap; word-break: break-word; }
}
</style>
