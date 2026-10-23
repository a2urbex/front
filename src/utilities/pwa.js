import { ref } from 'vue';

const ua = navigator.userAgent || '';

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIOS = () => /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(ua);
export const isMobile = () => isIOS() || isAndroid() || /Mobi/i.test(ua);

// Sur iOS, seul Safari sait installer une PWA (Chrome, Firefox, Edge… doivent renvoyer vers Safari)
export const iosOtherBrowser = () => {
  if (!isIOS()) return null;
  if (/CriOS/.test(ua)) return 'Chrome';
  if (/FxiOS/.test(ua)) return 'Firefox';
  if (/EdgiOS/.test(ua)) return 'Edge';
  if (/OPiOS|OPT\//.test(ua)) return 'Opera';
  if (/GSA\//.test(ua)) return 'Google';
  if (/DuckDuckGo/.test(ua)) return 'DuckDuckGo';
  return null;
};

export const inAppBrowser = () => {
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return 'Facebook';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  return null;
};

// Android : prompt natif capturé au plus tôt
export const installPrompt = ref(null);
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt.value = e;
});
window.addEventListener('appinstalled', () => {
  installPrompt.value = null;
});

export const promptInstall = async () => {
  const e = installPrompt.value;
  if (!e) return false;
  e.prompt();
  const { outcome } = await e.userChoice;
  installPrompt.value = null;
  return outcome === 'accepted';
};

const BYPASS = 'a2-pwa-bypass';
export const hasBypass = () => {
  try { return localStorage.getItem(BYPASS) === '1'; } catch { return false; }
};
export const setBypass = () => {
  try { localStorage.setItem(BYPASS, '1'); } catch {}
};
