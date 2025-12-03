<template>
  <div :class="['slider-container', wrapperClass]">
    <div
      class="slider-inner"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        v-for="(image, index) in filteredImages"
        :key="index"
        class="slide"
      >
        <img :src="image" />
      </div>
    </div>

    <button v-if="filteredImages.length > 1" class="slider-btn left" @click="prevSlide">
      <span>‹</span>
    </button>
    <button v-if="filteredImages.length > 1" class="slider-btn right" @click="nextSlide">
      <span>›</span>
    </button>

    <div v-if="filteredImages.length > 1" class="slider-dots">
      <span
        v-for="(image, index) in filteredImages"
        :key="index"
        class="slider-dot"
        :class="{ active: currentIndex === index }"
      ></span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export default {
  props: {
    images: {
      type: Array,
      required: true,
    },
    wrapperClass: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const currentIndex = ref(0)
    let interval = null

    // Filter out null/empty images
    const filteredImages = computed(() =>
      props.images.filter(img => img !== null && img !== undefined && img !== '')
    )

    const startInterval = () => {
      clearInterval(interval)
      interval = setInterval(() => {
        nextSlide(false) // auto-slide, don't reset interval again
      }, 5000)
    }

    const nextSlide = (resetInterval = true) => {
      if (filteredImages.value.length === 0) return
      currentIndex.value = (currentIndex.value + 1) % filteredImages.value.length
      if (resetInterval) startInterval()
    }

    const prevSlide = (resetInterval = true) => {
      if (filteredImages.value.length === 0) return
      currentIndex.value =
        (currentIndex.value - 1 + filteredImages.value.length) % filteredImages.value.length
      if (resetInterval) startInterval()
    }

    onMounted(() => {
      startInterval()
    })

    onUnmounted(() => {
      clearInterval(interval)
    })

    const touchStart = ref(0)
    const touchEnd = ref(0)

    const handleTouchStart = e => {
      touchStart.value = e.touches[0].clientX
    }

    const handleTouchMove = e => {
      touchEnd.value = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
      if (touchStart.value - touchEnd.value > 50) nextSlide()
      if (touchStart.value - touchEnd.value < -50) prevSlide()
    }

    // Reset interval whenever currentIndex changes
    watch(currentIndex, () => {
      startInterval()
    })

    // ✅ Reset index whenever images array changes
    watch(
      () => filteredImages.value,
      (newImages) => {
        currentIndex.value = 0
      }
    )

    return {
      currentIndex,
      filteredImages,
      nextSlide,
      prevSlide,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    }
  },
}
</script>

<style lang="scss">
@use '../assets/styles/components/imageSlider.scss' as *;
</style>
