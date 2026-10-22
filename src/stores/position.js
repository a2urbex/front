import { defineStore } from 'pinia';
import { distanceM, formatDistance } from '@/utilities/field';

// Position live partagée (carte, cartes de liste, exploration). Un seul watchPosition.
export const usePositionStore = defineStore('Position', {
  state: () => ({ pos: null, accuracy: null, watchId: null, error: null }),
  getters: {
    tracking: (s) => s.watchId !== null,
    distanceTo: (s) => (item) => {
      const lat = Number(item?.lat), lon = Number(item?.lon);
      if (!s.pos || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return distanceM(s.pos, [lat, lon]);
    },
    labelTo() {
      return (item) => {
        const d = this.distanceTo(item);
        return d === null ? '' : formatDistance(d);
      };
    },
  },
  actions: {
    // Demande explicite (déclenche le prompt navigateur si nécessaire). Résout true si une position est obtenue.
    request() {
      if (!window.isSecureContext || !navigator.geolocation) {
        this.error = 'insecure';
        return Promise.resolve(false);
      }
      return new Promise((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (p) => {
            this.pos = [p.coords.latitude, p.coords.longitude];
            this.accuracy = p.coords.accuracy;
            this.error = null;
            resolve(true);
          },
          (e) => {
            this.error = e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable';
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        ),
      );
    },
    start() {
      if (this.watchId !== null) return;
      // Hors HTTPS (ex. IP locale), le navigateur bloque la géoloc sans rien demander
      if (!window.isSecureContext || !navigator.geolocation) {
        this.error = 'insecure';
        return;
      }
      this.watchId = navigator.geolocation.watchPosition(
        (p) => {
          this.pos = [p.coords.latitude, p.coords.longitude];
          this.accuracy = p.coords.accuracy;
          this.error = null;
        },
        (e) => {
          this.error = e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable';
          if (e.code === e.PERMISSION_DENIED) this.stop();
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      );
    },
    stop() {
      if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.pos = null;
      if (this.error !== 'denied') this.error = null;
    },
  },
});
