import { defineStore } from 'pinia';

// '2.0.10' > '2.0.9' : comparaison numérique, segment par segment
const isNewer = (a, b) => {
  const pa = String(a || '').split('.').map(Number);
  const pb = String(b || '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0;
  }
  return false;
};

export const useVersionStore = defineStore('version', {
  state: () => ({
    code_version: '2.1.2', // Use for dev only
    latest_version: '',
  }),
  actions: {
    async getVersion() {
      try {
        const response = await fetch(import.meta.env.VITE_VERSION);

        if (!response.ok) {
          throw new Error('Failed to fetch version');
        }
        const data = await response.json();
        this.latest_version = data.current_version;
        // Mise à jour seulement si le serveur annonce une version PLUS RÉCENTE (pas en dev, ni avant un déploiement)
        if (isNewer(this.latest_version, this.code_version)) {
          this.status = 'outdated';
        } else {
          this.status = 'up-to-date';
        }
      } catch (error) {
        console.error('Error fetching version:', error);
      } finally {
      }
    },
  },
});
