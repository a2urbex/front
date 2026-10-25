<script setup>
defineProps({
  label: { type: String, default: 'No image available' },
});
</script>

<template>
  <div class="image-placeholder">
    <span class="image-placeholder__icon">
      <font-awesome-icon :icon="['fas', 'image']" />
    </span>
    <span class="image-placeholder__label">{{ label }}</span>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;

.image-placeholder {
  // se comporte comme l'<img> qu'il remplace (élément flex qui remplit l'espace)
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background:
    radial-gradient(110% 90% at 50% 38%, color-mix(in srgb, var(--tint) 10%, transparent) 0%, rgba(0, 0, 0, 0) 62%),
    linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(15, 15, 15, 0.96) 100%);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    color: $primary;
    background: color-mix(in srgb, var(--tint) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--tint) 28%, transparent);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.45),
      inset 0 0 18px color-mix(in srgb, var(--tint) 12%, transparent);
    font-size: 1.4rem;
    animation: image-placeholder-pulse 2.6s ease-in-out infinite;
  }

  &__label {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
    text-align: center;
    padding: 0 0.5rem;
  }
}

@keyframes image-placeholder-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), inset 0 0 18px color-mix(in srgb, var(--tint) 12%, transparent);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.5), inset 0 0 26px color-mix(in srgb, var(--tint) 22%, transparent);
  }
}
</style>
