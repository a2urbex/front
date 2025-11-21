<template>
  <div class="loader-container">
    <div class="loader-content">
      <div class="glitch-wrapper">
        <!-- <div class="glitch-text" data-text="INITIALIZING">INITIALIZING</div> -->
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="status-text">LOADING ASSETS...</div>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 300px;
}

.glitch-wrapper {
  position: relative;
}

.glitch-text {
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 4px;
  position: relative;
  color: #fff;
  
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &::before {
    left: 2px;
    text-shadow: -1px 0 #ff00c1;
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim 5s infinite linear alternate-reverse;
  }

  &::after {
    left: -2px;
    text-shadow: -1px 0 #00fff9;
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim2 5s infinite linear alternate-reverse;
  }
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #333;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #ffaa00;
  transform: translateX(-100%);
  animation: progress 2s ease-in-out infinite;
}

.status-text {
  font-size: 0.8rem;
  color: #888;
  letter-spacing: 2px;
  animation: blink 1s infinite;
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes glitch-anim {
  0% { clip: rect(31px, 9999px, 94px, 0); transform: skew(0.85deg); }
  5% { clip: rect(70px, 9999px, 18px, 0); transform: skew(0.09deg); }
  10% { clip: rect(6px, 9999px, 13px, 0); transform: skew(0.06deg); }
  15% { clip: rect(58px, 9999px, 98px, 0); transform: skew(0.32deg); }
  20% { clip: rect(4px, 9999px, 82px, 0); transform: skew(0.56deg); }
  25% { clip: rect(96px, 9999px, 42px, 0); transform: skew(0.22deg); }
  30% { clip: rect(23px, 9999px, 16px, 0); transform: skew(0.85deg); }
  35% { clip: rect(89px, 9999px, 4px, 0); transform: skew(0.05deg); }
  40% { clip: rect(34px, 9999px, 68px, 0); transform: skew(0.38deg); }
  45% { clip: rect(12px, 9999px, 91px, 0); transform: skew(0.68deg); }
  50% { clip: rect(56px, 9999px, 34px, 0); transform: skew(0.12deg); }
  55% { clip: rect(78px, 9999px, 23px, 0); transform: skew(0.94deg); }
  60% { clip: rect(45px, 9999px, 56px, 0); transform: skew(0.45deg); }
  65% { clip: rect(23px, 9999px, 78px, 0); transform: skew(0.78deg); }
  70% { clip: rect(67px, 9999px, 12px, 0); transform: skew(0.23deg); }
  75% { clip: rect(12px, 9999px, 45px, 0); transform: skew(0.67deg); }
  80% { clip: rect(89px, 9999px, 23px, 0); transform: skew(0.12deg); }
  85% { clip: rect(34px, 9999px, 67px, 0); transform: skew(0.89deg); }
  90% { clip: rect(56px, 9999px, 12px, 0); transform: skew(0.34deg); }
  95% { clip: rect(23px, 9999px, 89px, 0); transform: skew(0.56deg); }
  100% { clip: rect(67px, 9999px, 34px, 0); transform: skew(0.78deg); }
}

@keyframes glitch-anim2 {
  0% { clip: rect(65px, 9999px, 100px, 0); transform: skew(0.45deg); }
  5% { clip: rect(52px, 9999px, 74px, 0); transform: skew(0.12deg); }
  10% { clip: rect(79px, 9999px, 85px, 0); transform: skew(0.89deg); }
  15% { clip: rect(15px, 9999px, 56px, 0); transform: skew(0.34deg); }
  20% { clip: rect(67px, 9999px, 23px, 0); transform: skew(0.67deg); }
  25% { clip: rect(34px, 9999px, 12px, 0); transform: skew(0.23deg); }
  30% { clip: rect(89px, 9999px, 45px, 0); transform: skew(0.78deg); }
  35% { clip: rect(12px, 9999px, 67px, 0); transform: skew(0.45deg); }
  40% { clip: rect(56px, 9999px, 89px, 0); transform: skew(0.12deg); }
  45% { clip: rect(23px, 9999px, 34px, 0); transform: skew(0.56deg); }
  50% { clip: rect(78px, 9999px, 12px, 0); transform: skew(0.89deg); }
  55% { clip: rect(45px, 9999px, 56px, 0); transform: skew(0.34deg); }
  60% { clip: rect(12px, 9999px, 78px, 0); transform: skew(0.67deg); }
  65% { clip: rect(89px, 9999px, 23px, 0); transform: skew(0.23deg); }
  70% { clip: rect(34px, 9999px, 67px, 0); transform: skew(0.78deg); }
  75% { clip: rect(56px, 9999px, 12px, 0); transform: skew(0.45deg); }
  80% { clip: rect(23px, 9999px, 45px, 0); transform: skew(0.12deg); }
  85% { clip: rect(67px, 9999px, 89px, 0); transform: skew(0.56deg); }
  90% { clip: rect(12px, 9999px, 34px, 0); transform: skew(0.89deg); }
  95% { clip: rect(45px, 9999px, 56px, 0); transform: skew(0.23deg); }
  100% { clip: rect(78px, 9999px, 12px, 0); transform: skew(0.67deg); }
}
</style>
