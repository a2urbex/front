import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const isTransitioning = ref(false);

  const setTransitioning = (value) => {
    isTransitioning.value = value;
  };

  return {
    isTransitioning,
    setTransitioning,
  };
});
