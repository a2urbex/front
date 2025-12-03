<script setup>
import { useLocationStore } from '@/stores/location';
import LocationAdd from './LocationAdd.vue';
import { ref } from 'vue';

const props = defineProps({
    location: Object
});

const emit = defineEmits(['close']);
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
        emit('close');
    }
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
};

const handleEdit = () => {
    showEditPopup.value = true;
};

const handleClose = () => {
    showEditPopup.value = false;
};
</script>

<template>
    <button class="location-edit-trigger" @click="toggleContainer">
        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
    </button>
    <div class="location-edit-container" :class="{ active: showContainer }">
        <button class="location-edit-close" @click="toggleContainer">
            <font-awesome-icon :icon="['fas', 'times']" />
        </button>
        <button class="location-edit-button icon-edit" @click="handleEdit">
            <font-awesome-icon :icon="['fas', 'pencil']" /> Edit
        </button>
        <button class="location-edit-button icon-delete" @click="handleDelete">
            <font-awesome-icon :icon="['fas', 'trash']" /> Delete
        </button>
    
        <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
            <div class="delete-confirm-dialog">
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete this location?</p>
                <div class="delete-confirm-actions">
                    <button class="btn-cancel" @click="cancelDelete">Cancel</button>
                    <button class="btn-delete" @click="confirmDelete">Delete</button>
                </div>
            </div>
        </div>

        <LocationAdd 
            v-if="showEditPopup" 
            :isEdit="true"
            :editData="location"
            @close="handleClose" 
        />
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/locationEdit.scss' as *;
</style>
