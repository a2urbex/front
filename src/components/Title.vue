<template>
    <div class="title-container" :class="{ 'page-width': hasPageWidth }">
        <button v-if="showBackButton" class="back-button" @click="goBack">
            <font-awesome-icon :icon="['fas', 'angle-left']" />
        </button>
        <h2 v-appear>{{ title }}</h2>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps({
    title: {
        type: String,
        required: false
    },
    hasPageWidth: {
        type: Boolean,
        default: true
    }
});

const showBackButton = computed(() => {
    return router.currentRoute.value.path !== '/';
});

const goBack = () => {
    router.back();
};
</script>

<style scoped>
    .title-container {
        display: flex;
        align-items: center;
        background-color: #161616;
        position: relative;
        z-index: 5;
    }

    .back-button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        padding: 0.5rem 1rem 0.5rem 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
    }

    h2 {
        font-size: 24px;
        font-weight: 600;
        text-align: left;
        padding-top: 1rem;
        padding-bottom: 1rem;
        margin: 0 0 -.1rem 0;
        flex: 1;
    }
</style>
