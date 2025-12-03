<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const switchForm = () => {
  const newPath = route.path === '/login' ? '/register' : '/login'
  router.push(newPath)
}
</script>

<template>
  <div class="auth">
    <div class="auth-form">
      <router-view v-slot="{ Component }">
        <transition name="translate" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <div class="auth-switch">
        <h1 class="auth-switch__h1">Hello, Explorer!</h1>
        <p class="auth-switch__p">Welcome to our community. Please sign in or sign up to continue.</p>
        <button @click="switchForm" class="auth-switch__button">
        {{ route.path === '/login' ? 'Sign Up' : 'Login' }}
        </button>
    </div>
  </div>
</template>

<style lang="scss">
@use '../assets/styles/components/auth.scss' as *;
</style>
