import { defineStore } from 'pinia';
import { request } from '@/services/api';

const EP = '/exploration';

export const useExplorationStore = defineStore('Exploration', {
  state: () => ({ active: null, timer: null }),
  actions: {
    async fetch() {
      try {
        this.active = await request('GET', EP);
      } catch {
        this.active = null;
      }
      this.schedule();
    },
    async start(favoriteId) {
      this.active = await request('POST', EP, { favoriteId });
      this.schedule();
    },
    async end(reset = false) {
      await request('DELETE', `${EP}${reset ? '?reset=1' : ''}`);
      this.active = null;
      this.schedule();
    },
    // Expiration auto : re-vérifie côté serveur à l'échéance
    schedule() {
      clearTimeout(this.timer);
      if (!this.active?.expiresAt) return;
      const ms = Date.parse(this.active.expiresAt) - Date.now();
      this.timer = setTimeout(() => this.fetch(), Math.max(1000, Math.min(ms + 1000, 2 ** 31 - 1)));
    },
  },
});
