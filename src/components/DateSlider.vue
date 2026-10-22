<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { request } from '@/services/api'
import { useMapStore } from '@/stores/map'
import { useLocationStore } from '@/stores/location'

const DAY = 86400000
const mapStore = useMapStore()
const locationStore = useLocationStore()

// "Depuis ma dernière visite" : mémorisé par appareil
let lastVisit = null
try {
  lastVisit = Number(localStorage.getItem('a2-last-visit')) || null
  localStorage.setItem('a2-last-visit', String(Date.now()))
} catch {}

const weeks = ref([])
const today = Math.ceil(Date.now() / DAY)
const minDay = computed(() => (weeks.value.length ? Math.floor(Date.parse(weeks.value[0].week) / DAY) : today - 365))
const lo = ref(0)
const hi = ref(today)
const playing = ref(false)
const preset = ref(null)
let timer = null
let debounce = null

const maxTotal = computed(() => Math.max(1, ...weeks.value.map((w) => w.total)))
const span = computed(() => Math.max(1, today - minDay.value))
const fmt = (d) => new Date(d * DAY).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
const barStyle = (w) => {
  const d = Math.floor(Date.parse(w.week) / DAY)
  const inRange = d + 7 > lo.value && d <= hi.value
  return { left: `${((d - minDay.value) / span.value) * 100}%`, height: `${(w.total / maxTotal.value) * 100}%`, opacity: inRange ? 1 : 0.25 }
}

const loadHistogram = async () => {
  const filters = JSON.parse(JSON.stringify(locationStore.selectedFilters || {}))
  weeks.value = (await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/histogram`, { ...filters, showInvalid: mapStore.showInvalid })) || []
  if (!lo.value || lo.value < minDay.value) lo.value = minDay.value
}

const commit = (immediate = false) => {
  clearTimeout(debounce)
  const run = () => {
    const full = lo.value <= minDay.value && hi.value >= today
    mapStore.setDateRange(full ? null : lo.value * DAY, hi.value >= today ? null : (hi.value + 1) * DAY, preset.value ? lo.value * DAY : null)
  }
  immediate ? run() : (debounce = setTimeout(run, 350))
}

const onInput = (which, e) => {
  const v = Number(e.target.value)
  if (which === 'lo') lo.value = Math.min(v, hi.value)
  else hi.value = Math.max(v, lo.value)
  preset.value = null
  commit()
}

const applyPreset = (key) => {
  stop()
  const from = key === '7d' ? today - 7 : key === '30d' ? today - 30 : Math.floor((lastVisit || Date.now() - 30 * DAY) / DAY)
  preset.value = key
  lo.value = Math.max(minDay.value, from)
  hi.value = today
  commit(true)
}

const reset = () => {
  stop()
  preset.value = null
  lo.value = minDay.value
  hi.value = today
  commit(true)
}

// Lecture : charge [lo, aujourd'hui] une fois puis avance la poignée droite côté client
const play = () => {
  if (playing.value) return stop()
  if (hi.value >= today) hi.value = lo.value
  playing.value = true
  mapStore.setDateRange(lo.value * DAY, null, lo.value * DAY)
  const step = Math.max(1, Math.round((today - lo.value) / 80))
  timer = setInterval(() => {
    hi.value = Math.min(today, hi.value + step)
    mapStore.clipTo = (hi.value + 1) * DAY
    if (hi.value >= today) stop()
  }, 120)
}

const stop = () => {
  clearInterval(timer)
  timer = null
  if (!playing.value) return
  playing.value = false
  mapStore.clipTo = null
  commit(true)
}

watch(() => locationStore.selectedFilters, loadHistogram, { deep: true })
onMounted(() => {
  lo.value = minDay.value
  loadHistogram()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(debounce)
})
</script>

<template>
  <div class="date-slider">
    <div class="date-slider__presets">
      <button :class="{ on: preset === '7d' }" @click="applyPreset('7d')">7d</button>
      <button :class="{ on: preset === '30d' }" @click="applyPreset('30d')">30d</button>
      <button :class="{ on: preset === 'visit' }" @click="applyPreset('visit')">Since last visit</button>
      <button @click="reset">All</button>
    </div>
    <div class="date-slider__row">
      <button class="date-slider__play" @click="play" :title="playing ? 'Pause' : 'Play'">
        <font-awesome-icon :icon="['fas', playing ? 'pause' : 'play']" />
      </button>
      <div class="date-slider__track">
        <div class="date-slider__hist">
          <span v-for="w in weeks" :key="w.week" :style="barStyle(w)"></span>
        </div>
        <input type="range" :min="minDay" :max="today" :value="lo" @input="onInput('lo', $event)" aria-label="From" />
        <input type="range" :min="minDay" :max="today" :value="hi" @input="onInput('hi', $event)" aria-label="To" />
      </div>
    </div>
    <div class="date-slider__dates"><span>{{ fmt(lo) }}</span><span>{{ hi >= today ? 'today' : fmt(hi) }}</span></div>
  </div>
</template>
