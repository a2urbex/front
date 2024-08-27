<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { toast } from 'vue3-toastify';

const favoritesStore = useFavoritesStore();

const props = defineProps({
   id: String,
});

const isActive = ref(false);
const selectedItemId = ref(null);
const isAvailable = computed(() => !!selectedItemId.value); 
const toggleActive = () => {
   isActive.value = !isActive.value;
};

onMounted(async () => {
   await favoritesStore.getSummary();
});

const favoriteList = computed(() => favoritesStore.favoriteList);

const addToSelectedList = () => {
   if (selectedItemId.value) {
      favoritesStore.addLocation(props.id, selectedItemId.value);
   }
};
</script>

<template>
   <div class="favorite-modal">
      <div class="favorite-modal__trigger" @click="toggleActive">
         <font-awesome-icon :icon="['fas', 'heart']" />
      </div>
   </div>
   <div :class="['favorite-modal__content', { active: isActive }]">
      <div class="favorite-modal__content-header" @click="toggleActive">
         <button class="close-button" @click="$emit('close')">
            <font-awesome-icon :icon="['fas', 'angle-left']" />
        </button>
         <h3>Add to list</h3>
      </div>
      <fieldset>
         <div v-for="item in favoriteList" :key="item.id">
            <input 
               type="radio" 
               :id="`radio-${item.id}-${props.id}`" 
               name="contactMethod" 
               :value="item.id" 
               v-model="selectedItemId" 
            />
            <label :for="`radio-${item.id}-${props.id}`">{{ item.name }}</label>
         </div>
      </fieldset>
      <div class="favorite-modal__content-footer">
         <button 
            :class="['avorite-modal__content-footer-button-add', { active: isAvailable }]" 
            @click="addToSelectedList"
         >
            Add to selected list
         </button>
         <button 
            :class="['avorite-modal__content-footer-button-create', { active: !isAvailable }]"
         >
            Create List (not working yet)
         </button>
      </div>
   </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoriteModal.scss';
</style>
