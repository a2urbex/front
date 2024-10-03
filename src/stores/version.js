import { defineStore } from 'pinia';

export const useVersionStore = defineStore('version', {
    
    state: () => ({
        code_version: '0.0.37', // Use for dev only
        latest_version: {},
        loading: false
    }),
    actions: {
        async getVersion() {
            this.loading = true;
            try {
                const response = await fetch(import.meta.env.VITE_VERSION);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch version');
                }
                const data = await response.json();
                this.latest_version = data.current_version;
                if (this.code_version !== this.latest_version) {
                    this.status = 'outdated';
                } else {
                    this.status = 'up-to-date';
                }
            } catch (error) {
                console.error('Error fetching version:', error);
            } finally {
                this.loading = false;
            }
        }
    }
});
