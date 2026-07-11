<template>
  <div class="loader-container">
    <div class="torch-beam"></div>

    <div class="loader-content">
      <div class="loader-brand">
        <span class="loader-brand__mark">A2</span>URBEX
      </div>

      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>

      <div class="status-text">
        <span class="status-dot"></span>
        Entering the site&hellip;
      </div>
    </div>

    <div class="loader-vignette"></div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.loader-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  background:
    radial-gradient(120% 120% at 50% 40%, #0d0f14 0%, #050609 70%, #000 100%);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'Courier New', Courier, monospace;
}

.torch-beam {
  position: absolute;
  top: -30%;
  left: 50%;
  width: 60vmax;
  height: 60vmax;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 190, 120, 0.16) 0%, rgba(255, 170, 85, 0.05) 35%, transparent 65%);
  filter: blur(8px);
  animation: sweep 4.5s ease-in-out infinite;
  pointer-events: none;
}

.loader-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
  width: min(320px, 78vw);
  text-align: center;
}

.loader-brand {
  font-size: clamp(1.6rem, 7vw, 2.3rem);
  font-weight: 900;
  letter-spacing: 0.35em;
  color: #e8e2d6;
  text-transform: uppercase;
  text-shadow: 0 0 24px rgba(255, 170, 85, 0.35);
  animation: flicker 3.5s infinite;

  &__mark {
    color: #ffaa55;
    text-shadow: 0 0 18px rgba(255, 170, 85, 0.7);
  }
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  border-radius: 3px;
  background: linear-gradient(90deg, transparent, #ffaa55 50%, #fff 70%, transparent);
  box-shadow: 0 0 12px rgba(255, 170, 85, 0.6);
  animation: slide 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: #8a857c;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffaa55;
  box-shadow: 0 0 8px rgba(255, 170, 85, 0.8);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.loader-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 200px 60px rgba(0, 0, 0, 0.9);
}

@keyframes slide {
  0% { left: -45%; }
  100% { left: 105%; }
}

@keyframes sweep {
  0%, 100% { transform: translateX(-70%) rotate(-8deg); opacity: 0.7; }
  50% { transform: translateX(-30%) rotate(8deg); opacity: 1; }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  47% { opacity: 1; }
  48% { opacity: 0.55; }
  49% { opacity: 1; }
  70% { opacity: 0.85; }
  71% { opacity: 1; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

@media (prefers-reduced-motion: reduce) {
  .torch-beam, .loader-brand, .status-dot { animation: none; }
}
</style>
