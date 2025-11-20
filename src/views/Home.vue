<template>
  <div class="home">
    <ThreeBackground ref="threeBackground" />
    
    <div class="home-content">
      
      <div :class="['hero-wrapper', { 'is-auth-active': showAuth }]">
        <div class="hero-section">
          <div class="glitch-wrapper">
            <h1 class="glitch-text" data-text="A2URBEX">
              <transition name="fade" mode="out-in">A2URBEX</transition></h1>
          </div>
          <p class="tagline">Your exploration co-pilot</p>
          <p class="subtitle">We do not provide locations. We provide the tools to start your adventure.</p>
          
          <button 
            v-if="!showAuth && !authStore.token" 
            class="connect-btn" 
            @click="handleConnectClick"
          >
            <span class="connect-icon">⚡</span>
            <span>Connect</span>
            <div class="btn-glow"></div>
          </button>
        </div>
      </div>

      <transition name="slideUp">
        <div class="auth-container" v-if="showAuth && !authStore.token">
          <button class="close-btn" @click="closeAuth" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div class="auth-tabs">
            <button 
              :class="['auth-tab', { active: activeTab === 'login' }]"
              @click="activeTab = 'login'"
            >
              Sign In
            </button>
            <button 
              :class="['auth-tab', { active: activeTab === 'register' }]"
              @click="activeTab = 'register'"
            >
              Sign Up
            </button>
          </div>

          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'login'" key="login" class="auth-form">
              <form @submit.prevent="handleLogin">
                <div class="st-form-group">
                  <input 
                    autocomplete="username"
                    type="email" 
                    id="login-email"
                    v-model="loginData.email" 
                    required 
                    placeholder=" "
                  />
                  <label for="login-email">Email</label>
                  <div class="input-line"></div>
                </div>

                <div class="st-form-group">
                  <input 
                    autocomplete="current-password"
                    type="password"
                    id="login-password" 
                    v-model="loginData.password" 
                    required 
                    placeholder=" "
                  />
                  <label for="login-password">Password</label>
                  <div class="input-line"></div>
                </div>

                <div class="st-checkbox-group">
                  <input type="checkbox" id="keep" v-model="loginData.keepMeLoggedIn" />
                  <label for="keep">Keep me logged in</label>
                </div>

                <button type="submit" class="st-btn">
                  <span>Enter</span>
                  <div class="btn-glow"></div>
                </button>

                <router-link class="forgot-link" to="/forgot-password">
                  Forgot password?
                </router-link>
              </form>
            </div>

            <div v-else key="register" class="auth-form">
              <form @submit.prevent="handleRegister">
                <div class="st-form-group">
                  <input 
                    type="text"
                    id="register-username" 
                    v-model="registerData.username" 
                    required 
                    placeholder=" "
                  />
                  <label for="register-username">Username</label>
                  <div class="input-line"></div>
                </div>

                <div class="st-form-group">
                  <input 
                    autocomplete="username"
                    type="email"
                    id="register-email" 
                    v-model="registerData.email" 
                    required 
                    placeholder=" "
                  />
                  <label for="register-email">Email</label>
                  <div class="input-line"></div>
                </div>

                <div class="st-form-group">
                  <input 
                    autocomplete="current-password"
                    type="password"
                    id="register-password" 
                    v-model="registerData.password" 
                    required 
                    placeholder=" "
                  />
                  <label for="register-password">Password</label>
                  <div class="input-line"></div>
                </div>

                <button type="submit" class="st-btn">
                  <span>Join the Zone</span>
                  <div class="btn-glow"></div>
                </button>
              </form>
            </div>
          </transition>
        </div>
      </transition>

      <div class="footer-link">
        <a href="https://github.com/a2urbex" target="_blank" class="github-link">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import ThreeBackground from '@/components/ThreeBackground.vue';
const threeBackground = ref(null);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const activeTab = ref('login');
const showAuth = ref(false);

const handleConnectClick = () => {
  showAuth.value = true;
  if (threeBackground.value) {
    threeBackground.value.setBoost(true);
  }
};

const closeAuth = () => {
  showAuth.value = false;
  if (threeBackground.value) {
    threeBackground.value.setBoost(false);
  }
};

const loginData = ref({
  email: '',
  password: '',
  keepMeLoggedIn: false
});

const registerData = ref({
  username: '',
  email: '',
  password: ''
});

const handleLogin = async () => {
  try {
    await authStore.login(
      loginData.value.email, 
      loginData.value.password, 
      loginData.value.keepMeLoggedIn
    );
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const handleRegister = async () => {
  try {
    await authStore.register(
      registerData.value.email,
      registerData.value.password,
      registerData.value.username
    );
    setTimeout(() => {
      router.push('/locations');
    }, 1500);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

onMounted(async () => {
  // Check if user is already authenticated
  if (authStore.token) {
    const isValid = await authStore.validateToken();
    if (isValid) {
      router.push('/locations');
      return;
    }
  }
  
  // Check if we should auto-open auth form from query params
  if (route.query.auth) {
    showAuth.value = true;
    activeTab.value = route.query.auth === 'register' ? 'register' : 'login';
    // Clean up URL by removing query param
    router.replace({ path: '/', query: {} });
  }
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/base.scss';
@import '@/assets/styles/components/home.scss';
</style>