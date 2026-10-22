<script setup>
import { ref } from 'vue'
import { request } from '@/services/api'
import { RATINGS, REASONS, statusEmoji } from '@/utilities/field'

const props = defineProps({ item: Object })
const emit = defineEmits(['updated'])

const mode = ref(null) // null | 'valid' | 'invalid'
const danger = ref(false)
const saving = ref(false)

const send = async (status, value) => {
  if (saving.value) return
  saving.value = true
  try {
    const body = { status, danger: danger.value, ...(status === 'valid' ? { rating: value } : { reason: value }) }
    const updated = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/${props.item.id}/visit`, body)
    emit('updated', { ...props.item, ...updated })
    mode.value = null
    danger.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="field-status">
    <div class="field-status__head">
      <span class="field-status__label">Status</span>
      <span class="field-status__current" v-if="item?.status && item.status !== 'unvisited'">
        {{ statusEmoji(item) }}{{ item.danger ? ' ⚠️' : '' }}
        <time v-if="item.visitedAt">{{ new Date(item.visitedAt).toLocaleDateString('en-GB') }}</time>
      </span>
    </div>

    <div class="field-status__choice" v-if="!mode">
      <button class="fs-btn fs-btn--valid" @click="mode = 'valid'">Valid</button>
      <button class="fs-btn fs-btn--invalid" @click="mode = 'invalid'">Invalid</button>
    </div>

    <template v-else>
      <div class="field-status__grid">
        <template v-if="mode === 'valid'">
          <button v-for="r in RATINGS" :key="r.key" class="fs-opt" :disabled="saving" @click="send('valid', r.key)">
            <span>{{ r.emoji }}</span><small>{{ r.label }}</small>
          </button>
        </template>
        <template v-else>
          <button v-for="r in REASONS" :key="r.key" class="fs-opt" :disabled="saving" @click="send('invalid', r.key)">
            <span>{{ r.emoji }}</span><small>{{ r.label }}</small>
          </button>
        </template>
      </div>
      <div class="field-status__foot">
        <label class="fs-danger"><input type="checkbox" v-model="danger" /> ⚠️ Danger</label>
        <button class="fs-cancel" @click="mode = null">Cancel</button>
      </div>
    </template>
  </div>
</template>
