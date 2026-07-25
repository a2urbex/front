<template>
  <div class="home">
    <transition name="fade">
      <Loader v-if="isLoading" />
    </transition>
    <ThreeBackground ref="threeBackground" @ready="onSceneReady" />
    
    <div class="home-content" :class="{ 'fade-out-content': isTransitioning, 'hidden': isLoading }">
      
      <div :class="['hero', { 'is-auth-active': showAuth }]">
        <div class="hero__eyebrow">
          <span class="hero__dot"></span>
          Urban exploration · trusted network
        </div>

        <h1 class="hero__title">A2<span class="hero__title-accent">URBEX</span></h1>

        <p class="hero__tagline">Your exploration co-pilot.</p>

        <p class="hero__meta" v-if="locationCount !== null">
          <span class="hero__count">{{ locationCount }}</span> spots mapped — shared only with trusted people.
        </p>

        <div class="hero__actions">
          <button
            v-if="!showAuth && !authStore.token"
            class="connect-btn"
            @click="handleConnectClick"
          >
            <span>Connect</span>
            <svg class="connect-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          <a href="https://www.instagram.com/a2urbex" target="_blank" rel="noopener" class="insta-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            @a2urbex
          </a>
        </div>
      </div>

      <transition name="fade">
        <div class="auth-overlay" v-if="showAuth && !authStore.token">
          <div class="auth-container">
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
              Sign up
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

                <a href="#" class="forgot-link" @click.prevent="activeTab = 'forgot'">
                  Forgot password?
                </a>
              </form>
            </div>

            <div v-else-if="activeTab === 'register'" key="register" class="auth-form">
              <p class="auth-notice">
                After signing up, you'll be able to see your own locations and those shared by your friends.
                Once an administrator approves your access request, you'll unlock the full A2urbex catalogue. Manual approval. Only for trusted people.
              </p>
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
                  <span>Send request</span>
                  <div class="btn-glow"></div>
                </button>
              </form>
            </div>

            <div v-else key="forgot" class="auth-form">
              <form @submit.prevent="handleForgotPassword">
                <div class="st-form-group">
                  <input 
                    autocomplete="email"
                    type="email" 
                    id="forgot-email"
                    v-model="forgotEmail" 
                    required 
                    placeholder=" "
                  />
                  <label for="forgot-email">Email</label>
                  <div class="input-line"></div>
                </div>

                <button type="submit" class="st-btn">
                  <span>Reset Password</span>
                  <div class="btn-glow"></div>
                </button>

                <a href="#" class="forgot-link" @click.prevent="activeTab = 'login'">
                  Back to Sign In
                </a>
              </form>
            </div>
          </transition>
          </div>
        </div>
      </transition>

      <!-- <div class="footer-link">
        <a href="https://github.com/a2urbex" target="_blank" class="github-link">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          GitHub
        </a>
      </div> -->

      <div class="copyright">
        © a2urbex 2026
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { request } from '@/services/api';
import ThreeBackground from '@/components/ThreeBackground.vue';
import Loader from '@/components/Loader.vue';

const locationCount = ref(null);

const threeBackground = ref(null);
const isLoading = ref(true);

const onSceneReady = () => {
  // Petit délai pour être sûr que la première frame est rendue
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
};

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUIStore();
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

const isTransitioning = ref(!!authStore.token);

const performTransition = async () => {
  isTransitioning.value = true;
  uiStore.setTransitioning(true); // Hide header and remove margin
  showAuth.value = false; // Hide auth modal if open
  
  if (threeBackground.value) {
    const fallPromise = threeBackground.value.fall();
    await new Promise(resolve => setTimeout(resolve, 600));
    await threeBackground.value.fadeOut();
    await fallPromise;
  }
  
  await router.push('/locations');
  // Reset UI state after navigation is complete
  uiStore.setTransitioning(false);
};

const handleLogin = async () => {
  try {
    await authStore.login(
      loginData.value.email, 
      loginData.value.password, 
      loginData.value.keepMeLoggedIn
    );
    await performTransition();
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
    await performTransition();
    await performTransition();
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

const forgotEmail = ref('');

const handleForgotPassword = async () => {
  try {
    await authStore.forgotPassword(forgotEmail.value);
    activeTab.value = 'login';
  } catch (error) {
    console.error('Forgot password failed:', error);
  }
};

const fetchLocationCount = async () => {
  try {
    const res = await request('GET', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/count`);
    if (res && typeof res.total === 'number') {
      locationCount.value = res.total;
    }
  } catch (error) {
    console.error('Failed to fetch location count:', error);
  }
};

onMounted(async () => {
  fetchLocationCount();
  // Check if user is already authenticated
  if (authStore.token) {
    const isValid = await authStore.validateToken();
    if (isValid) {
      // If already logged in, do the transition immediately but faster
      if (threeBackground.value) {
         uiStore.setTransitioning(true);
         // Wait for mount
         await new Promise(resolve => setTimeout(resolve, 100));
         await performTransition();
      } else {
         router.push('/locations');
      }
      return;
    } else {
      // Token invalid, show UI
      isTransitioning.value = false;
      uiStore.setTransitioning(false);
    }
  } else {
    // No token, ensure UI is visible
    isTransitioning.value = false;
    uiStore.setTransitioning(false);
  }
  
  // Check if we should auto-open auth form from query params
  if (route.query.auth) {
    showAuth.value = true;
    if (route.query.auth === 'register') {
      activeTab.value = 'register';
    } else if (route.query.auth === 'forgot') {
      activeTab.value = 'forgot';
    } else {
      activeTab.value = 'login';
    }
    // Clean up URL by removing query param
    router.replace({ path: '/', query: {} });
  }
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/base.scss' as *;
@use '@/assets/styles/components/home.scss' as *;

.fade-out-content {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  pointer-events: none;
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

</style>