import { toast } from 'vue3-toastify';

// Petites notifications in-app : 3 s maximum, quelle que soit la durée demandée à l'appel
const MAX = 3000;
for (const kind of ['success', 'error', 'info', 'warning', 'warn']) {
  const original = toast[kind];
  if (typeof original !== 'function') continue;
  toast[kind] = (content, options = {}) => original(content, { ...options, autoClose: Math.min(options.autoClose || MAX, MAX) });
}
