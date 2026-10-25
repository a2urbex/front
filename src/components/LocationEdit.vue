<script setup>
import { useLocationStore } from '@/stores/location';
import LocationAdd from './LocationAdd.vue';
import { ref } from 'vue';

const props = defineProps({
    location: Object
});

const emit = defineEmits(['close', 'deleted']);
const showEditPopup = ref(false);
const showDeleteConfirm = ref(false);
const showContainer = ref(false);

const locationStore = useLocationStore();

const toggleContainer = () => {
    showContainer.value = !showContainer.value;
};

const handleDelete = async () => {
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (props.location && props.location.id) {
        await locationStore.deleteLocation(props.location.id);
        showDeleteConfirm.value = false;
        emit('deleted', props.location.id);
        emit('close');
    }
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
    showContainer.value = false;
};

const handleEdit = () => {
    showEditPopup.value = true;
};

const handleClose = () => {
    showEditPopup.value = false;
    showContainer.value = false;
};
</script>

<template>
    <button class="location-edit-trigger" @click="toggleContainer" aria-label="More actions">
        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
    </button>
    <!-- Menu monté dans <body> : jamais coincé dans le défilement de la fiche -->
    <Teleport to="body">
        <div v-if="showContainer && !showDeleteConfirm && !showEditPopup" class="ios-sheet-backdrop" @click.self="toggleContainer">
            <div class="ios-action-sheet" role="dialog" aria-label="Spot actions">
                <div class="ios-action-sheet__group">
                    <p class="ios-action-sheet__title">{{ location.name || 'This spot' }}</p>
                    <button class="ios-action-sheet__btn" @click="handleEdit"><font-awesome-icon :icon="['fas', 'pencil']" />Edit spot</button>
                    <button class="ios-action-sheet__btn is-danger" @click="handleDelete"><font-awesome-icon :icon="['fas', 'trash']" />Delete spot</button>
                </div>
                <button class="ios-action-sheet__btn ios-action-sheet__cancel" @click="toggleContainer">Cancel</button>
            </div>
        </div>

        <div v-if="showDeleteConfirm" class="ui-dialog-backdrop" @click.self="cancelDelete">
            <div class="ui-dialog" role="alertdialog" aria-labelledby="del-title">
                <h3 id="del-title">Delete this spot?</h3>
                <p>"{{ location.name || 'This spot' }}" will be removed for everyone. This can't be undone.</p>
                <div class="ui-dialog__actions">
                    <button class="ui-dialog__btn" @click="cancelDelete">Cancel</button>
                    <button class="ui-dialog__btn is-danger" @click="confirmDelete">Delete</button>
                </div>
            </div>
        </div>

        <LocationAdd v-if="showEditPopup" :isEdit="true" :editData="location" @close="handleClose" />
    </Teleport>
</template>

<style lang="scss">
@use '../assets/styles/components/locationEdit.scss' as *;
</style>
