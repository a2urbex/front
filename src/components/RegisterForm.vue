<template>
    <transition name="translate" mode="out-in" appear>
        <div class="login-form">
            <h2>Sign up</h2>
            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <input class="form-input" placeholder=" " type="firstname" id="firstname" v-model="firstname"
                        required />
                    <label class="form-label" for="firstname">First Name:</label>
                </div>
                <div class="form-group">
                    <input class="form-input" placeholder=" " type="lastname" id="lastname" v-model="lastname"
                        required />
                    <label class="form-label" for="lastname">Last Name:</label>
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
                <button class="form-submit" type="submit">Sing up</button>
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
            firstname: '',
            lastname: ''
        };
    },
    methods: {
        async handleSubmit() {
            const authStore = useAuthStore();
            await authStore.register(this.email, this.password, this.firstname, this.lastname);
        },
    },
};
</script>