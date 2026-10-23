<script setup>
import Title from '@/components/Title.vue'
import { ref } from 'vue'
import { toast } from 'vue3-toastify'
import { request } from '@/services/api'

const CHANNELS = [
  { key: 'users_news', label: 'New spots' },
  { key: 'outings', label: 'Outings' },
  { key: 'admin_system', label: 'System (admins)' },
]

const form = ref({ channel: 'users_news', audience: 'all', title: '', body: '', url: '/' })
const sending = ref(false)

const send = async () => {
  if (!form.value.title.trim() || sending.value) return
  sending.value = true
  try {
    const res = await request('POST', '/admin/notify', form.value)
    const detail = `${res.recipients ?? 0} recipient(s) · ${res.sent} sent · ${res.failed ?? 0} failed${res.pruned ? ` · ${res.pruned} expired removed` : ''}`
    if (res.error || !res.sent) toast.error(`${detail}${res.error ? ` — ${res.error}` : ''}`, { position: toast.POSITION.TOP_CENTER, autoClose: 6000, theme: 'dark' })
    else toast.success(detail, { position: toast.POSITION.TOP_CENTER, theme: 'dark' })
    form.value.title = ''
    form.value.body = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Title title="Notifications" />
  <form class="admin-notify page-width" @submit.prevent="send">
    <label>
      <span>Channel</span>
      <select v-model="form.channel">
        <option v-for="c in CHANNELS" :key="c.key" :value="c.key">{{ c.label }}</option>
      </select>
    </label>
    <label>
      <span>Audience</span>
      <select v-model="form.audience">
        <option value="all">Everyone subscribed to the channel</option>
        <option value="admins">Admins only</option>
      </select>
    </label>
    <label>
      <span>Title</span>
      <input v-model="form.title" maxlength="120" required />
    </label>
    <label>
      <span>Body</span>
      <textarea v-model="form.body" maxlength="300" rows="3"></textarea>
    </label>
    <label>
      <span>Link (app path)</span>
      <input v-model="form.url" placeholder="/locations" />
    </label>
    <button type="submit" :disabled="sending || !form.title.trim()">{{ sending ? 'Sending…' : 'Send' }}</button>
  </form>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
.admin-notify {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 520px;
  padding: 24px 16px;
  label { display: flex; flex-direction: column; gap: 6px; }
  span { font: 11px $font-mono; text-transform: uppercase; letter-spacing: .08em; color: #888; }
  input, select, textarea { padding: 10px; background: #1c1c1c; color: #eee; border: 1px solid #333; border-radius: 2px; font: inherit; }
  button { align-self: flex-start; padding: 12px 22px; border: 0; background: $primary; color: #111; font-weight: 700; text-transform: uppercase; cursor: pointer;
    &:disabled { opacity: .5; } }
}
</style>
