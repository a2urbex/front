<script setup>
import { computed, ref } from 'vue'
import { request } from '@/services/api'
import { RATINGS, REASONS, reasonOf, statusEmoji } from '@/utilities/field'
import { toast } from 'vue3-toastify'

const props = defineProps({ item: Object })
const emit = defineEmits(['updated', 'removed'])

const mode = ref(null) // null | 'valid' | 'invalid'
const danger = ref(false)
const saving = ref(false)
const picking = ref(false) // « Change » : on revient au choix Valid / Invalid
const hasStatus = computed(() => props.item?.status && props.item.status !== 'unvisited')
const choiceLabel = computed(() => props.item?.status === 'valid'
  ? RATINGS.find((r) => r.key === props.item.rating)?.label
  : reasonOf(props.item.invalidReason)?.label)

const send = async (status, value) => {
  if (saving.value) return
  saving.value = true
  try {
    const body = { status, danger: danger.value, ...(status === 'valid' ? { rating: value } : { reason: value }) }
    const updated = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/${props.item.id}/visit`, body)
    // « Bullshit » : le serveur a masqué le point, la fiche se ferme
    if (updated?.removed) {
      toast.success('Spot removed', { position: toast.POSITION.TOP_CENTER, autoClose: 1500, theme: 'dark' })
      emit('removed', props.item.id)
      return
    }
    emit('updated', { ...props.item, ...updated })
    mode.value = null
    picking.value = false
    danger.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="field-status">
    <span class="field-status__label">Status</span>

    <!-- Statut déjà donné : une ligne de résultat, modifiable -->
    <div v-if="hasStatus && !picking" class="fs-result" :class="`is-${item.status}`">
      <span class="fs-result__emoji">{{ statusEmoji(item) }}</span>
      <span class="fs-result__text">
        <b>{{ item.status === 'valid' ? 'Valid' : 'Invalid' }}<template v-if="choiceLabel"> · {{ choiceLabel }}</template></b>
        <small v-if="item.visitedAt">Visited {{ new Date(item.visitedAt).toLocaleDateString('en-GB') }}</small>
      </span>
      <span v-if="item.danger" class="fs-result__danger">⚠️ Danger</span>
      <button class="fs-result__change" @click="picking = true">Change</button>
    </div>

    <div class="field-status__choice" v-else-if="!mode">
      <button class="fs-btn fs-btn--valid" @click="mode = 'valid'"><font-awesome-icon :icon="['fas', 'check']" />Valid</button>
      <button class="fs-btn fs-btn--invalid" @click="mode = 'invalid'"><font-awesome-icon :icon="['fas', 'xmark']" />Invalid</button>
      <button v-if="hasStatus" class="fs-cancel fs-cancel--full" @click="picking = false">Cancel</button>
    </div>

    <template v-else>
      <div class="field-status__grid">
        <button v-for="r in mode === 'valid' ? RATINGS : REASONS" :key="r.key" class="fs-opt" :disabled="saving" @click="send(mode, r.key)">
          <span>{{ r.emoji }}</span><small>{{ r.label }}</small>
        </button>
      </div>
      <div class="fs-foot">
        <button type="button" class="fs-danger" role="switch" :aria-checked="danger" @click="danger = !danger">
          <span>⚠️ Dangerous spot</span><span class="ios-switch" :class="{ on: danger }"></span>
        </button>
        <button class="fs-cancel" @click="mode = null">Back</button>
      </div>
    </template>
  </div>
</template>
