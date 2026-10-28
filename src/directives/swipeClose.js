// v-swipe-close="fermer" : glisser une feuille vers le bas pour la fermer (mobile).
// - depuis la zone du haut (poignée, image, titre de la feuille) : toujours possible ;
// - ailleurs : seulement quand le contenu touché est tout en haut de son défilement
//   (le geste peut démarrer en cours de route, dès que le défilement revient à 0).
const GRAB = '.ld-grabber, .ld-media, .ios-action-sheet__title, [data-swipe-grab]';
const SKIP = 'input, textarea, select, .location-card-display__slider, [data-no-swipe]';
const isMobile = () => window.matchMedia('(max-width: 990px)').matches;

const scrolledBetween = (node, root) => {
  for (let n = node; n && n !== root.parentElement; n = n.parentElement) {
    if (n.scrollTop > 0) return true;
  }
  return false;
};

export default {
  mounted(el, binding) {
    el._swipeClose = binding.value;
    let startY = 0, lastY = 0, startT = 0, dy = 0, state = 'idle', grab = false, target = null;

    const start = (e) => {
      if (!isMobile() || e.touches.length !== 1 || e.target.closest(SKIP)) return;
      target = e.target;
      grab = !!e.target.closest(GRAB);
      startY = lastY = e.touches[0].clientY;
      startT = Date.now();
      dy = 0;
      state = 'maybe';
    };
    const move = (e) => {
      if (state === 'idle') return;
      const y = e.touches[0].clientY;
      if (state === 'maybe') {
        // on ne commence que vers le bas, et seulement si rien n'est défilé sous le doigt
        if (y - lastY < 0 && !grab) { lastY = y; startY = y; return; }
        if (!grab && scrolledBetween(target, el)) { lastY = y; startY = y; return; }
        if (y - startY < 6) return;
        state = 'drag';
        startY = y;
        startT = Date.now();
        el.style.transition = 'none';
      }
      dy = Math.max(0, y - startY);
      if (e.cancelable) e.preventDefault();
      el.style.transform = `translateY(${dy}px)`;
    };
    const end = () => {
      if (state !== 'drag') { state = 'idle'; return; }
      state = 'idle';
      const fast = dy > 40 && dy / Math.max(1, Date.now() - startT) > 0.5;
      el.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)';
      if (dy > 110 || fast) {
        el.style.transform = 'translateY(110%)';
        setTimeout(() => el._swipeClose?.(), 200);
      } else {
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 260);
      }
    };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    el._swipeOff = () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  },
  updated(el, binding) {
    el._swipeClose = binding.value;
  },
  unmounted(el) {
    el._swipeOff?.();
  },
};
