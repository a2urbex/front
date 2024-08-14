<template>
  <transition name="translate" mode="out-in" appear>
  <div class="login-form">
      <h2>Sign in</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
            <input class="form-input" placeholder=" " type="email" id="email" v-model="email" required />
            <label class="form-label" for="email">Email:</label>
        </div>
        <div class="form-group">
            <input class="form-input" placeholder=" " type="password" id="password" v-model="password" required />
            <label class="form-label" for="password">Password:</label>
        </div>

        <router-link class="form-link" to="/forgot-password">Forgot your password?</router-link>
        <button class="form-submit" type="submit">Sign in</button>
    </form>
  </div>
  </transition>
</template>


<script>
export default {
  data() {
      return {
          email: '',
          password: '',
      };
  },
  methods: {
      handleSubmit() {
          console.log('Email:', this.email);
          console.log('Password:', this.password);
      },
  },
};
</script>