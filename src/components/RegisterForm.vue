<script>
import { useAuthStore } from '@/stores/auth';

export default {
    data() {
        return {
            email: '',
            password: '',
            username: ''
        };
    },
    methods: {
        async handleSubmit() {
            const authStore = useAuthStore();            
            try {
                await authStore.register(this.email, this.password, this.firstname, this.lastname);
                setTimeout(() => { this.$router.push('/locations'); }, 1500);
            } catch (error) {
                console.error('Login failed:', error);
            }
        },
    },
};
</script>

<template>
    <transition name="translate" mode="out-in" appear>
        <div class="login-form">
            <h2>Sign up</h2>
            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <input class="form-input" placeholder=" " type="username" id="username" v-model="username"
                        required />
                    <label class="form-label" for="username">Username:</label>
                </div>
                <div class="form-group">
                    <input class="form-input" autocomplete="username" placeholder=" " type="email" id="email" v-model="email" required />
                    <label class="form-label" for="email">Email:</label>
                </div>
                <div class="form-group">
                    <input class="form-input" autocomplete="current-password" placeholder=" " type="password" id="password" v-model="password"
                        required />
                    <label class="form-label" for="password">Password:</label>
                </div>
                <button class="form-submit" type="submit">Sign up</button>
            </form>
        </div>
    </transition>
</template>