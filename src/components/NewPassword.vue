<script>
import { ref} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue3-toastify';

export default {
    setup() {
        const route = useRoute();
        const router = useRouter();
        const id = route.params.id;

        console.log(id);

        const authStore = useAuthStore();

        const password = ref('');
        const repeatPassword = ref('');

        const handleSubmit = async () => {
            if (password.value !== repeatPassword.value) {
                toast.error('Passwords do not match.', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
                return;
            }

            try {
                await authStore.resetPassword(id, password.value);
                setTimeout(() => { router.push('/login');  }, 1500);
            } catch (error) {
                console.error('Forgot password trigger failed:', error);
            }
        };

        return {
            password,
            repeatPassword,
            handleSubmit,
            id
        };
    },
};
</script>

<template>
    <transition name="translate" mode="out-in" appear>
        <div class="login-form">
            <h2>New Password</h2>
            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <input 
                        class="form-input" 
                        placeholder=" " 
                        autocomplete="new-password" 
                        type="password" 
                        id="password" 
                        v-model="password" 
                        required 
                    />
                    <label class="form-label" for="password">New password:</label>
                </div>
                <div class="form-group">
                    <input 
                        class="form-input" 
                        placeholder=" " 
                        autocomplete="new-password" 
                        type="password" 
                        id="repeat-password" 
                        v-model="repeatPassword"
                        required 
                    />
                    <label class="form-label" for="repeat-password">Repeat password:</label>
                </div>
                <p class="info">*Password must be at least 8 characters long.</p>
                <button class="form-submit" type="submit">Reset</button>
            </form>
        </div>
    </transition>
</template>
