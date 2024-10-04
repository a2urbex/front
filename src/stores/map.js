import { defineStore } from 'pinia';

export const useMapStore = defineStore('Map', {
  state: () => ({
    open: false,
    type: null,
    typeId: null
  })
})