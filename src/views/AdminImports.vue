<script setup>
import Title from '@/components/Title.vue'
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import { request } from '@/services/api'
import { useUsersStore } from '@/stores/users'

const ADMIN_IMPORTS = '/admin/imports'
const ADMIN_SOURCES = '/admin/sources'

const usersStore = useUsersStore()

const PLATFORM = 'a2urbex'
const assignee = ref(PLATFORM)
const overwriteDuplicates = ref(false)
const createFavoritesList = ref(true)

// Source selection (required)
const sources = ref([])
const sourceId = ref(null)
const showNewSourceInput = ref(false)
const newSourceName = ref('')
const creatingSource = ref(false)

// Upload state
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadSuccess = ref(false)
const uploadedFileName = ref('')
const uploadedFileSize = ref('')
const lastResult = ref(null)
const fileInput = ref(null)

// History
const historyList = ref([])
const historyLoading = ref(false)

const userOptions = computed(() => {
  return (usersStore.users || [])
    .map(u => u.username)
    .filter(name => !!name && name.toLowerCase() !== PLATFORM)
})

const canUpload = computed(() => !!sourceId.value && !uploading.value && !uploadSuccess.value)

const loadSources = async () => {
  try {
    const data = await request('GET', ADMIN_SOURCES)
    sources.value = data?.list ?? []
  } catch (e) {
    console.error('Failed to load sources', e)
  }
}

const createSource = async () => {
  const name = newSourceName.value.trim()
  if (!name) return
  creatingSource.value = true
  try {
    const created = await request('POST', ADMIN_SOURCES, { name })
    sources.value.push({ id: created.id, name: created.name, location_count: 0 })
    sources.value.sort((a, b) => a.name.localeCompare(b.name))
    sourceId.value = created.id
    newSourceName.value = ''
    showNewSourceInput.value = false
    toast.success(`Source "${created.name}" created`)
  } catch (e) {
    toast.error(e?.message || 'Could not create source')
  } finally {
    creatingSource.value = false
  }
}

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return ''
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const fmtDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const summarize = (item) => {
  const parts = []
  if (item.inserted) parts.push(`${item.inserted} inserted`)
  if (item.updated) parts.push(`${item.updated} updated`)
  if (item.skipped) parts.push(`${item.skipped} skipped`)
  if (!parts.length) parts.push(`${item.total || 0} markers`)
  return parts.join(', ')
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const data = await request('GET', ADMIN_IMPORTS)
    historyList.value = data?.list ?? []
  } catch (e) {
    console.error('Failed to load import history', e)
  } finally {
    historyLoading.value = false
  }
}

// Event handlers
const onDragOver = (e) => { e.preventDefault(); isDragging.value = true }
const onDragLeave = () => { isDragging.value = false }

const onDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) handleFile(files[0])
}

const triggerFileInput = () => { fileInput.value.click() }

const onFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) handleFile(files[0])
}

const handleFile = (file) => {
  if (!sourceId.value) {
    toast.error('Select a source before uploading.')
    return
  }
  const name = file.name.toLowerCase()
  if (!name.endsWith('.kml') && !name.endsWith('.kmz')) {
    toast.error('Invalid file format. Only .kml and .kmz files are supported.')
    return
  }
  uploadedFileName.value = file.name
  uploadedFileSize.value = formatSize(file.size)
  uploadFile(file)
}

const uploadFile = async (file) => {
  uploading.value = true
  uploadSuccess.value = false
  uploadProgress.value = 0
  lastResult.value = null

  // Indeterminate-ish progress: we have no per-byte hook through fetch().
  // Use XHR to track upload progress, but route response through our auth.
  try {
    const fd = new FormData()
    fd.append('file', file)
    if (assignee.value) fd.append('assignee', assignee.value)
    fd.append('sourceId', String(sourceId.value))
    fd.append('overwriteDuplicates', String(overwriteDuplicates.value))
    fd.append('createFavoritesList', String(createFavoritesList.value))

    const result = await xhrUpload(fd, (pct) => { uploadProgress.value = pct })

    uploading.value = false
    uploadSuccess.value = true
    lastResult.value = result
    toast.success(`Imported ${result.inserted ?? 0} markers from ${file.name}`)
    await loadHistory()
  } catch (e) {
    uploading.value = false
    uploadSuccess.value = false
    uploadProgress.value = 0
    toast.error(e?.message || 'Upload failed')
    await loadHistory()
  }
}

const xhrUpload = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${import.meta.env.VITE_API_BASE_URL}${ADMIN_IMPORTS}`
    xhr.open('POST', url)
    const token = localStorage.getItem('authToken')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) onProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 99)))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        try { resolve(JSON.parse(xhr.responseText || '{}')) } catch { resolve({}) }
      } else {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

const resetUpload = () => {
  uploadSuccess.value = false
  uploadedFileName.value = ''
  uploadedFileSize.value = ''
  uploadProgress.value = 0
  lastResult.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const deleteHistoryItem = async (item) => {
  if (!confirm(`Delete ${item.filename} from the import history?`)) return
  try {
    await request('DELETE', `${ADMIN_IMPORTS}/${item.id}`)
    historyList.value = historyList.value.filter(h => h.id !== item.id)
    toast.success('Entry removed from history.')
  } catch (e) {
    console.error('Failed to delete history entry', e)
  }
}

onMounted(async () => {
  try { await usersStore.getAll() } catch (_) {}
  await Promise.all([loadHistory(), loadSources()])
})
</script>

<template>
  <Title title="Import Management" />

  <div class="imports-page page-width">
    <!-- Header visual description -->
    <div class="imports-page__header-intro">
      <h2>KML & KMZ Importer</h2>
      <p>Upload complex spatial paths and convert them into interactive POIs or favorited tracks directly usable on maps.</p>
    </div>

    <div class="imports-page__main-layout">
      <!-- Left Column: Dropzone and Status -->
      <div class="imports-page__left-col">
        
        <!-- Drag & Drop Container -->
        <div 
          class="imports-page__dropzone"
          :class="{ 'is-dragging': isDragging, 'is-uploading': uploading, 'is-success': uploadSuccess }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="canUpload && triggerFileInput()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="imports-page__file-input" 
            accept=".kml,.kmz" 
            @change="onFileSelect" 
          />

          <!-- Default State -->
          <div v-if="!uploading && !uploadSuccess" class="imports-page__dropzone-inner">
            <div class="imports-page__dropzone-icon">
              <font-awesome-icon :icon="['fas', 'upload']" />
            </div>
            <div class="imports-page__dropzone-text">
              <h4>Drag & drop your file here</h4>
              <p>or <span>browse your files</span></p>
              <span class="formats-allowed">Allowed formats: KML, KMZ (max. 50 MB)</span>
            </div>
          </div>

          <!-- Uploading State -->
          <div v-else-if="uploading" class="imports-page__dropzone-inner is-active-state">
            <div class="imports-page__dropzone-icon is-spinning">
              <font-awesome-icon :icon="['fas', 'file-arrow-up']" />
            </div>
            <div class="imports-page__progress-container">
              <div class="imports-page__progress-info">
                <span class="file-name">{{ uploadedFileName }}</span>
                <span class="percent">{{ uploadProgress }}%</span>
              </div>
              <div class="imports-page__progress-bar">
                <div class="imports-page__progress-bar-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <span class="uploading-hint">Analyzing and parsing GPS coordinates...</span>
            </div>
          </div>

          <!-- Success State -->
          <div v-else-if="uploadSuccess" class="imports-page__dropzone-inner is-active-state">
            <div class="imports-page__dropzone-icon is-success-icon">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
            </div>
            <div class="imports-page__success-container">
              <h4>Import completed!</h4>
              <p class="success-file-details">
                <strong>{{ uploadedFileName }}</strong> ({{ uploadedFileSize }}) —
                <template v-if="lastResult">
                  {{ lastResult.inserted || 0 }} inserted,
                  {{ lastResult.updated || 0 }} updated,
                  {{ lastResult.skipped || 0 }} skipped
                  out of {{ lastResult.total || 0 }} markers.
                </template>
                <template v-else>processed.</template>
              </p>
              <button class="imports-page__reset-btn" @click.stop="resetUpload">
                <font-awesome-icon :icon="['fas', 'plus']" /> Import another file
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Settings & Configuration -->
      <div class="imports-page__right-col">
        <div class="imports-page__settings-card">
          <div class="settings-card-header">
            <h3>Import Configuration</h3>
            <span class="badge-optional">Options</span>
          </div>

          <div class="imports-page__settings-body">
            <!-- Source select (required) -->
            <div class="imports-page__field">
              <label for="import-source">Source <span style="color:#f87171">*</span></label>
              <div class="custom-select-wrapper">
                <select id="import-source" class="custom-select" v-model="sourceId">
                  <option :value="null" disabled>Select a source…</option>
                  <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div v-if="!showNewSourceInput" class="field-hint" style="display:flex;justify-content:space-between;align-items:center;gap:.5rem">
                <span>Required. Imported locations will be tagged with this source.</span>
                <button type="button" class="imports-page__reset-btn" style="margin:0;padding:.3rem .7rem;font-size:.75rem" @click="showNewSourceInput = true">New</button>
              </div>
              <div v-else class="imports-page__new-source-row">
                <input
                  v-model="newSourceName"
                  type="text"
                  class="custom-select"
                  placeholder="New source name"
                  @keyup.enter="createSource"
                />
                <button class="imports-page__reset-btn" :disabled="creatingSource || !newSourceName.trim()" @click="createSource">Create</button>
                <button class="imports-page__reset-btn" style="background:transparent;border-color:rgba(255,255,255,0.1);color:#888" @click="showNewSourceInput = false; newSourceName = ''">Cancel</button>
              </div>
            </div>

            <hr class="settings-divider" />

            <!-- Assignee select -->
            <div class="imports-page__field">
              <label for="import-assignee">Attribute imported locations to</label>
              <div class="custom-select-wrapper">
                <select id="import-assignee" class="custom-select" v-model="assignee">
                  <option :value="PLATFORM">a2urbex (platform)</option>
                  <option v-for="name in userOptions" :key="name" :value="name">{{ name }}</option>
                </select>
              </div>
              <span class="field-hint">Choose <strong>a2urbex</strong> (default) to leave the imported markers ownerless (platform-owned), or attribute them to a specific user.</span>
            </div>

            <hr class="settings-divider" />

            <!-- Options Toggles -->
            <div class="imports-page__toggles">
              <!-- Toggle 1: Overwrite -->
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-title">Overwrite duplicates</span>
                  <span class="toggle-desc">Updates existing markers with matching names within ~50 m.</span>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="overwriteDuplicates">
                  <span class="slider round"></span>
                </label>
              </div>

              <!-- Toggle 3: Create Favorites List -->
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-title">New Favorites List</span>
                  <span class="toggle-desc">Creates a favorites list named after the KML/KMZ file and assigns it to the chosen user.</span>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="createFavoritesList">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- History Section -->
    <div class="imports-page__history-section">
      <div class="imports-page__history-header">
        <h3>Recent Import History</h3>
        <span class="imports-count-badge">{{ historyList.length }} files</span>
      </div>

      <!-- History Table / Cards -->
      <div class="imports-page__history-container">
        <div v-if="historyLoading && !historyList.length" class="imports-page__empty-history">
          Loading…
        </div>
        <div v-else-if="historyList.length === 0" class="imports-page__empty-history">
          No import history available.
        </div>

        <div v-else class="imports-page__history-list">
          <div
            v-for="item in historyList"
            :key="item.id"
            class="imports-page__history-item"
            :class="`is-${item.state === 'finished' ? 'success' : (item.state === 'error' ? 'failed' : 'running')}`"
          >
            <div class="item-icon-wrapper" :class="`is-${item.state === 'finished' ? 'success' : (item.state === 'error' ? 'failed' : 'running')}`">
              <font-awesome-icon :icon="['fas', 'file-code']" />
            </div>

            <div class="item-details">
              <div class="item-primary">
                <span class="item-filename" :title="item.filename">{{ item.filename }}</span>
                <span class="item-badge" :class="`status--${item.state === 'finished' ? 'success' : (item.state === 'error' ? 'failed' : 'running')}`">
                  {{ item.state === 'finished' ? 'Processed' : (item.state === 'error' ? 'Failed' : 'Running') }}
                </span>
              </div>
              <div class="item-secondary">
                <span class="detail-tag size">{{ formatSize(item.size) }}</span>
                <span class="detail-tag count">{{ summarize(item) }}</span>
                <span class="detail-tag date">
                  {{ fmtDate(item.started_at) }} — assigned to <strong>{{ item.assignee_username || '—' }}</strong>
                  <template v-if="item.uploader_username"> by <strong>{{ item.uploader_username }}</strong></template>
                </span>
                <span v-if="item.source_name" class="detail-tag">source <strong>{{ item.source_name }}</strong></span>
                <span v-if="item.error" class="detail-tag error-detail" :title="item.error">{{ item.error }}</span>
              </div>
            </div>

            <div class="item-actions">
              <button
                class="history-action-btn delete"
                @click="deleteHistoryItem(item)"
                title="Delete from history"
              >
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.imports-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;

  &__header-intro {
    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(120deg, #fff 0%, rgba(#fff, 0.6) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      font-size: 0.95rem;
      color: #888;
      margin: 0;
      max-width: 750px;
      line-height: 1.6;
    }
  }

  &__main-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 2rem;

    @media (max-width: $md) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  &__left-col {
    display: flex;
    flex-direction: column;
  }

  // Drag & Drop Area
  &__dropzone {
    flex: 1;
    min-height: 280px;
    background: rgba(255, 255, 255, 0.015);
    border: 2px dashed rgba(255, 255, 255, 0.08);
    border-radius: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, rgba($primary, 0.02) 0%, transparent 70%);
      pointer-events: none;
      transition: opacity 0.3s ease;
      opacity: 0.5;
    }

    &:hover {
      border-color: rgba($primary, 0.45);
      background: rgba(255, 255, 255, 0.03);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);

      &::after {
        opacity: 1;
      }

      .imports-page__dropzone-icon {
        color: $primary;
        transform: translateY(-5px);
        background: rgba($primary, 0.12);
        box-shadow: 0 0 15px rgba($primary, 0.15);
      }
    }

    input {
      display: none;
    }

    &.is-dragging {
      border-color: $primary;
      background: rgba($primary, 0.05);
      box-shadow: 0 0 20px rgba($primary, 0.1);
      transform: scale(1.02);

      .imports-page__dropzone-icon {
        color: $primary;
        transform: scale(1.1) translateY(-5px);
      }
    }

    &.is-uploading {
      border-style: solid;
      border-color: rgba(#4fc3f7, 0.3);
      background: rgba(255, 255, 255, 0.02);
      cursor: default;
    }

    &.is-success {
      border-style: solid;
      border-color: rgba(74, 222, 128, 0.3);
      background: rgba(74, 222, 128, 0.02);
      cursor: default;
    }

    &-inner {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
      z-index: 2;

      &.is-active-state {
        gap: 1.8rem;
      }
    }

    &-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

      &.is-spinning {
        color: #4fc3f7;
        background: rgba(#4fc3f7, 0.1);
        border-color: rgba(#4fc3f7, 0.2);
        animation: float 2s ease-in-out infinite;
      }

      &.is-success-icon {
        color: #4ade80;
        background: rgba(74, 222, 128, 0.1);
        border-color: rgba(74, 222, 128, 0.2);
      }
    }

    &-text {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      h4 {
        font-size: 1.1rem;
        font-weight: 500;
        color: #fff;
        margin: 0;
      }

      p {
        font-size: 0.9rem;
        color: #888;
        margin: 0;

        span {
          color: $primary;
          text-decoration: underline;
        }
      }

      .formats-allowed {
        font-size: 0.72rem;
        color: #555;
        margin-top: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
    }

    &-file-input {
      display: none;
    }
  }

  // Upload Progress
  &__progress-container {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;

    .file-name {
      color: #fff;
      font-weight: 500;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .percent {
      color: #4fc3f7;
      font-weight: 600;
    }
  }

  &__progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;

    &-fill {
      height: 100%;
      background: linear-gradient(90deg, #4fc3f7 0%, #00b0ff 100%);
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(#4fc3f7, 0.5);
      transition: width 0.15s ease-out;
    }
  }

  .uploading-hint {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.2rem;
    font-style: italic;
  }

  // Success Container
  &__success-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    max-width: 450px;

    h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #4ade80;
      margin: 0;
      text-shadow: 0 0 15px rgba(74, 222, 128, 0.15);
    }

    .success-file-details {
      font-size: 0.88rem;
      color: #aaa;
      margin: 0;
      line-height: 1.5;

      strong {
        color: #fff;
        font-weight: 500;
      }
    }
  }

  &__reset-btn {
    margin-top: 0.5rem;
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.3);
    color: #4ade80;
    padding: 0.55rem 1.2rem;
    border-radius: 0.6rem;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(74, 222, 128, 0.2);
      border-color: rgba(74, 222, 128, 0.5);
      color: #fff;
    }
  }

  // Settings Card
  &__settings-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;

    .settings-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      h3 {
        font-size: 1.15rem;
        font-weight: 600;
        color: #fff;
        margin: 0;
        letter-spacing: -0.01em;
      }

      .badge-optional {
        font-size: 0.65rem;
        color: #888;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }

  &__settings-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #ccc;
    }

    .field-hint {
      font-size: 0.72rem;
      color: #666;
      line-height: 1.4;
    }
  }

  &__new-source-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.5rem;

    input { flex: 1; }
  }

  // Custom Select Styling
  .custom-select-wrapper {
    position: relative;
    width: 100%;

    &::after {
      content: '▾';
      position: absolute;
      top: 50%;
      right: 1rem;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.4);
      pointer-events: none;
      font-size: 0.9rem;
    }
  }

  .custom-select {
    width: 100%;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.6rem;
    padding: 0.75rem 1rem;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    outline: none;
    appearance: none;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: rgba(0, 0, 0, 0.35);
    }

    &:focus {
      border-color: rgba($primary, 0.4);
      box-shadow: 0 0 10px rgba($primary, 0.05);
    }

    option {
      background: #111;
      color: #fff;
      padding: 0.5rem;
    }
  }

  .settings-divider {
    border: none;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 0;
  }

  // Toggles Styling
  &__toggles {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;

      .toggle-title {
        font-size: 0.88rem;
        font-weight: 500;
        color: #fff;
      }

      .toggle-desc {
        font-size: 0.76rem;
        color: #777;
        line-height: 1.4;
      }
    }
  }

  // Custom Toggle Switch (CSS-based)
  .switch {
    position: relative;
    display: inline-block;
    width: 2.75rem;
    height: 1.5rem;
    flex-shrink: 0;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: .4s;
    border-radius: 34px;

    &::before {
      position: absolute;
      content: "";
      height: 1rem;
      width: 1rem;
      left: 0.2rem;
      top: 50%;
      transform: translateY(-50%);
      background-color: #aaa;
      transition: .4s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: rgba($primary, 0.15);
    border-color: rgba($primary, 0.45);
  }

  input:focus + .slider {
    box-shadow: 0 0 1px rgba($primary, 0.3);
  }

  input:checked + .slider::before {
    transform: translate(1.25rem, -50%);
    background-color: $primary;
    box-shadow: 0 0 8px rgba($primary, 0.5);
  }

  // History Section
  &__history-section {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-top: 1rem;
  }

  &__history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .imports-count-badge {
      font-size: 0.78rem;
      color: #888;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }
  }

  &__empty-history {
    color: #555;
    font-size: 0.9rem;
    padding: 2.5rem;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    text-align: center;
  }

  &__history-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  &__history-item {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 1rem;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }

    &.is-failed {
      border-color: rgba(248, 113, 113, 0.15);
      background: rgba(248, 113, 113, 0.005);
      
      &:hover {
        background: rgba(248, 113, 113, 0.015);
        border-color: rgba(248, 113, 113, 0.25);
      }
    }

    .item-icon-wrapper {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.5);

      &.is-success {
        color: rgba($primary, 0.8);
        background: rgba($primary, 0.05);
        border-color: rgba($primary, 0.15);
      }

      &.is-failed {
        color: #f87171;
        background: rgba(248, 113, 113, 0.08);
        border-color: rgba(248, 113, 113, 0.18);
      }
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
      min-width: 0;
    }

    .item-primary {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .item-filename {
        font-size: 0.95rem;
        font-weight: 500;
        color: #fff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }

      .item-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;

        &.status--success {
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.25);
          color: #4ade80;
        }

        &.status--failed {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.25);
          color: #f87171;
        }
      }
    }

    .item-secondary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.8rem;
      font-size: 0.78rem;
      color: #666;

      .detail-tag {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.1rem;
        flex-direction: row;
        flex-wrap: wrap;

        &:not(:last-child)::after {
          content: '•';
          position: absolute;
          right: -0.5rem;
          color: #333;
        }

        strong {
          color: #888;
          font-weight: 500;
          margin-left: 0.15rem;
        }
      }

      .size {
        color: #888;
      }

      .count {
        color: rgba($primary, 0.7);
      }

      .error-detail {
        color: #f87171;
        max-width: 28rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-left: auto;
      flex-shrink: 0;

      .history-action-btn {
        background: transparent;
        border: none;
        color: #666;
        cursor: pointer;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        transition: all 0.25s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        &.download:hover {
          color: #4fc3f7;
          background: rgba(#4fc3f7, 0.08);
        }

        &.delete:hover {
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
        }
      }
    }
  }
}

// Float Animation for progress icon
@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(180deg); }
  100% { transform: translateY(0px) rotate(360deg); }
}

@media (max-width: 768px) {
  .imports-page {
    padding-top: 1.5rem;
    gap: 1.8rem;

    &__header-intro {
      h2 {
        font-size: 1.5rem;
      }
      p {
        font-size: 0.88rem;
      }
    }

    &__dropzone {
      min-height: 240px;
      padding: 1.5rem;
    }

    &__settings-card {
      padding: 1.5rem;
    }

    &__history-item {
      padding: 1rem;
      gap: 0.8rem;

      .item-icon-wrapper {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.1rem;
      }

      .item-primary {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
      }

      .item-secondary {
        gap: 0.5rem;
        font-size: 0.72rem;

        .detail-tag:not(:last-child)::after {
          content: '';
        }
      }
    }
  }
}
</style>
