<script>
export default {
    data() {
        return {
            email: ''
        };
    },
    methods: {
        handleSubmit() {
            console.log('Email:', this.email);
        },
    },
};
</script>

<template>
    <transition name="translate" mode="out-in" appear>
        <div class="login-form">
            <h2>Reset Password</h2>
            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <input class="form-input" placeholder=" " type="email" id="email" v-model="email" required />
                    <label class="form-label" for="email">Email:</label>
                </div>
                <button class="form-submit" type="submit">Sing up</button>
            </form>
        </div>
    </transition>
</template>