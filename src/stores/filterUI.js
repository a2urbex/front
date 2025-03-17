import { defineStore } from 'pinia';

export const useFilterUIStore = defineStore('filterUI', {
  state: () => ({
    showContent: false
  }),
  actions: {
    setShowContent(value) {
      this.showContent = value;
    },
    toggleShowContent() {
      this.showContent = !this.showContent;
    }
  }
}); 