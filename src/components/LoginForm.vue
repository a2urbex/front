<template>
    <transition name="translate" mode="out-in" appear>
        <div class="login-form">
            <h2>Sign in</h2>
            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <input autocomplete="username" class="form-input" placeholder=" " type="email" id="email"
                        v-model="email" required />
                    <label class="form-label" for="email">Email:</label>
                </div>
                <div class="form-group">
                    <input autocomplete="current-password" class="form-input" placeholder=" " type="password"
                        id="password" v-model="password" required />
                    <label class="form-label" for="password">Password:</label>
                </div>
                <div class="form-group">
                    <input type="checkbox" class="form-checkbox" id="keep" v-model="keepMeLoggedIn" />
                    <label class="form-checkbox-label" for="keep">Keep me logged in</label>
                </div>
                <button class="form-submit" type="submit">Sign in</button>
                <router-link class="form-link" to="/forgot-password">
                    Forgot your password?
                </router-link>
            </form>
        </div>
    </transition>
</template>

<script>
import { useAuthStore } from '@/stores/auth';

export default {
    data() {
        return {
            email: '',
            password: '',
            keepMeLoggedIn: false,
        };
    },
    methods: {
        async handleSubmit() {
            const authStore = useAuthStore();
            try {
                await authStore.login(this.email, this.password, this.keepMeLoggedIn);
                setTimeout(() => { this.$router.push('/locations'); }, 1500);
            } catch (error) {
                console.error('Login failed:', error.message || 'An unexpected error occurred.');
            }
        },
    },
};
</script>