<script setup>
import Title from '@/components/Title.vue'
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import { request } from '@/services/api'

const ADMIN_SOURCES = '/admin/sources'

const sources = ref([])
const loading = ref(false)

// Create
const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)

// Rename (per row)
const editingId = ref(null)
const editingName = ref('')

// Merge selection
const mergeSelected = ref([])
const mergeTargetId = ref(null)
const merging = ref(false)

const load = async () => {
  loading.value = true
  try {
    const data = await request('GET', ADMIN_SOURCES)
    sources.value = data?.list ?? []
  } catch (e) {
    toast.error('Could not load sources')
  } finally {
    loading.value = false
  }
}

const createSource = async () => {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await request('POST', ADMIN_SOURCES, { name })
    newName.value = ''
    showCreate.value = false
    toast.success('Source created')
    await load()
  } catch (e) {
    toast.error(e?.message || 'Failed to create source')
  } finally {
    creating.value = false
  }
}

const startEdit = (s) => {
  editingId.value = s.id
  editingName.value = s.name
}

const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
}

const saveEdit = async (s) => {
  const name = editingName.value.trim()
  if (!name || name === s.name) { cancelEdit(); return }
  try {
    await request('PATCH', `${ADMIN_SOURCES}/${s.id}`, { name })
    toast.success('Source renamed')
    cancelEdit()
    await load()
  } catch (e) {
    toast.error(e?.message || 'Rename failed')
  }
}

const deleteSource = async (s) => {
  if (s.location_count > 0) {
    toast.error(`Cannot delete: ${s.location_count} location(s) still use this source. Merge first.`)
    return
  }
  if (!confirm(`Delete source "${s.name}"?`)) return
  try {
    await request('DELETE', `${ADMIN_SOURCES}/${s.id}`)
    toast.success('Source deleted')
    await load()
  } catch (e) {
    toast.error(e?.message || 'Delete failed')
  }
}

const toggleMergeSelect = (id) => {
  const i = mergeSelected.value.indexOf(id)
  if (i >= 0) mergeSelected.value.splice(i, 1)
  else mergeSelected.value.push(id)
  if (!mergeSelected.value.includes(mergeTargetId.value)) mergeTargetId.value = null
}

const canMerge = computed(() => mergeSelected.value.length >= 2 && !!mergeTargetId.value && mergeSelected.value.includes(mergeTargetId.value))

const mergeSources = async () => {
  if (!canMerge.value) return
  const target = sources.value.find(s => s.id === mergeTargetId.value)
  const others = mergeSelected.value.filter(id => id !== mergeTargetId.value)
  const othersNames = sources.value.filter(s => others.includes(s.id)).map(s => s.name).join(', ')
  if (!confirm(`Merge ${othersNames} into "${target.name}"?\nLocations will be reassigned, then the merged sources will be deleted.`)) return
  merging.value = true
  try {
    await request('POST', `${ADMIN_SOURCES}/merge`, { targetId: mergeTargetId.value, sourceIds: others })
    toast.success('Sources merged')
    mergeSelected.value = []
    mergeTargetId.value = null
    await load()
  } catch (e) {
    toast.error(e?.message || 'Merge failed')
  } finally {
    merging.value = false
  }
}

onMounted(load)
</script>

<template>
  <Title title="Source Manager" />

  <div class="sources-page page-width">
    <div class="sources-page__header">
      <div>
        <h2>Source Manager</h2>
        <p>Rename, merge or delete the sources used to tag imported locations.</p>
      </div>
      <button class="sources-page__primary-btn" @click="showCreate = !showCreate">
        <font-awesome-icon :icon="['fas', 'plus']" /> New
      </button>
    </div>

    <div v-if="showCreate" class="sources-page__create-row">
      <input v-model="newName" type="text" placeholder="Source name" @keyup.enter="createSource" />
      <button :disabled="creating || !newName.trim()" @click="createSource">Create</button>
      <button class="ghost" @click="showCreate = false; newName = ''">Cancel</button>
    </div>

    <div class="sources-page__section">
      <h3>Sources</h3>
      <div v-if="loading && !sources.length" class="sources-page__empty">Loading…</div>
      <div v-else-if="!sources.length" class="sources-page__empty">No sources yet.</div>
      <div v-else class="sources-page__list">
        <div v-for="s in sources" :key="s.id" class="sources-page__row">
          <label class="sources-page__check">
            <input
              type="checkbox"
              :checked="mergeSelected.includes(s.id)"
              @change="toggleMergeSelect(s.id)"
            />
          </label>

          <div class="sources-page__name">
            <template v-if="editingId === s.id">
              <input v-model="editingName" type="text" @keyup.enter="saveEdit(s)" @keyup.esc="cancelEdit" />
              <button @click="saveEdit(s)">Save</button>
              <button class="ghost" @click="cancelEdit">Cancel</button>
            </template>
            <template v-else>
              <span class="sources-page__name-text">{{ s.name }}</span>
              <button class="icon" title="Rename" @click="startEdit(s)">
                <font-awesome-icon :icon="['fas', 'pencil']" />
              </button>
            </template>
          </div>

          <span class="sources-page__count">{{ s.location_count }} location{{ s.location_count === 1 ? '' : 's' }}</span>

          <button
            class="icon danger"
            :disabled="s.location_count > 0"
            :title="s.location_count > 0 ? 'Merge locations elsewhere before deleting' : 'Delete'"
            @click="deleteSource(s)"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="mergeSelected.length >= 2" class="sources-page__merge-bar">
      <span>{{ mergeSelected.length }} selected — keep as:</span>
      <select v-model="mergeTargetId">
        <option :value="null" disabled>Pick target…</option>
        <option v-for="id in mergeSelected" :key="id" :value="id">
          {{ sources.find(s => s.id === id)?.name }}
        </option>
      </select>
      <button :disabled="!canMerge || merging" @click="mergeSources">
        {{ merging ? 'Merging…' : 'Merge selected' }}
      </button>
      <button class="ghost" @click="mergeSelected = []; mergeTargetId = null">Clear</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.sources-page {
  padding: 2rem 1.25rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 2.5rem;
    gap: 1.2rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
      background: linear-gradient(120deg, #fff 0%, rgba(#fff, 0.6) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #888; margin: .3rem 0 0; }
  }

  &__primary-btn {
    background: rgba($primary, 0.15);
    border: 1px solid rgba($primary, 0.4);
    color: $primary;
    padding: .55rem 1rem;
    border-radius: .6rem;
    cursor: pointer;
    display: inline-flex; gap: .4rem; align-items: center;

    &:hover { background: rgba($primary, 0.25); }
  }

  &__create-row {
    display: flex;
    gap: .5rem;

    input {
      flex: 1;
      background: rgba(0,0,0,.25);
      border: 1px solid rgba(255,255,255,.08);
      color: #fff;
      padding: .55rem .8rem;
      border-radius: .5rem;
      outline: none;
    }

    button {
      background: rgba($primary, 0.15);
      border: 1px solid rgba($primary, 0.4);
      color: $primary;
      padding: .55rem 1rem;
      border-radius: .5rem;
      cursor: pointer;

      &.ghost {
        background: transparent;
        border-color: rgba(255,255,255,.1);
        color: #888;
      }

      &:disabled { opacity: .4; cursor: not-allowed; }
    }
  }

  .icon.danger {
   border:none; 
  }

  &__section h3 {
    color: #fff;
    font-size: 1.15rem;
    margin: 0 0 .8rem;
  }

  &__empty {
    color: #555;
    padding: 2rem;
    border: 1px dashed rgba(255,255,255,.05);
    border-radius: 1rem;
    text-align: center;
  }

  &__list { display: flex; flex-direction: column; gap: .5rem; }

  &__row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 1rem;
    padding: .9rem 1rem;
    background: rgba(255,255,255,.015);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: .8rem;

    &:hover { background: rgba(255,255,255,.03); }

    @media (max-width: 600px) {
      grid-template-columns: auto 1fr auto;
      grid-template-areas:
        "check name del"
        "check count del";
      row-gap: .35rem;
      column-gap: .75rem;
      padding: .8rem .9rem;

      .sources-page__check { grid-area: check; }
      .sources-page__name { grid-area: name; }
      .sources-page__count { grid-area: count; justify-self: start; }
      > button.icon.danger { grid-area: del; align-self: center; }
    }
  }

  &__check input { width: 1.1rem; height: 1.1rem; cursor: pointer; }

  &__name {
    display: flex;
    align-items: center;
    gap: .5rem;

    input {
      flex: 1;
      background: rgba(0,0,0,.25);
      border: 1px solid rgba(255,255,255,.08);
      color: #fff;
      padding: .35rem .6rem;
      border-radius: .4rem;
      outline: none;
    }

    button {
      background: rgba($primary, 0.15);
      border: 1px solid rgba($primary, 0.4);
      color: $primary;
      padding: .3rem .6rem;
      border-radius: .4rem;
      font-size: .8rem;
      cursor: pointer;

      &.ghost {
        background: transparent;
        border-color: rgba(255,255,255,.1);
        color: #888;
      }

      &.icon {
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.08);
        color: #aaa;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: .55rem;
        font-size: .85rem;
        transition: all .2s ease;

        &:hover:not(:disabled) {
          color: #fff;
          background: rgba(255,255,255,.08);
          border-color: rgba(255,255,255,.18);
        }
      }

      &.icon.danger {
        position: relative;
        color: #fca5a5;
        background: linear-gradient(135deg, rgba(248,113,113,.14) 0%, rgba(220,38,38,.08) 100%);
        border-color: rgba(248,113,113,.32);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 1px 2px rgba(0,0,0,.25);

        &:hover:not(:disabled) {
          color: #fff;
          background: linear-gradient(135deg, rgba(248,113,113,.32) 0%, rgba(220,38,38,.22) 100%);
          border-color: rgba(248,113,113,.7);
          box-shadow: 0 0 0 1px rgba(248,113,113,.25), 0 6px 14px -4px rgba(248,113,113,.45);
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 0 0 1px rgba(248,113,113,.4) inset;
        }
      }

      &.icon:disabled {
        cursor: not-allowed;
        color: #555;
        background: rgba(255,255,255,.015);
        border-color: rgba(255,255,255,.05);
        box-shadow: none;
        transform: none;
      }
    }
  }

  &__name-text {
    color: #fff;
    font-weight: 500;
  }

  &__count {
    color: #888;
    font-size: .8rem;
    padding: .2rem .6rem;
    border-radius: 20px;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.06);
  }

  &__merge-bar {
    position: sticky;
    bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: .6rem;
    align-items: center;
    padding: .8rem 1rem;
    background: rgba(17,17,17,.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba($primary, 0.3);
    border-radius: .8rem;
    box-shadow: 0 8px 30px rgba(0,0,0,.4);

    select {
      background: rgba(0,0,0,.4);
      border: 1px solid rgba(255,255,255,.1);
      color: #fff;
      padding: .4rem .7rem;
      border-radius: .4rem;
    }

    button {
      background: rgba($primary, 0.2);
      border: 1px solid rgba($primary, 0.5);
      color: $primary;
      padding: .45rem .9rem;
      border-radius: .4rem;
      cursor: pointer;

      &.ghost {
        background: transparent;
        border-color: rgba(255,255,255,.1);
        color: #888;
      }

      &:disabled { opacity: .4; cursor: not-allowed; }
    }

    span { color: #ccc; font-size: .9rem; }
  }
}
</style>
