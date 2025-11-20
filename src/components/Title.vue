<template>
    <div class="title-container">
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

const props = defineProps({
    title: {
        type: String,
        required: false
    },
    hasPageWidth: {
        type: Boolean,
        default: true
    },
    goHistory: {
        type: Boolean,
        default: true
    }
});

const showBackButton = computed(() => {
    return router.currentRoute.value.path !== '/';
});

const goBack = () => {
    if (props.goHistory) {
        router.back();
    }
};
</script>

<style scoped>
    .title-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        position: relative;
        z-index: 8;
        padding: 0.5rem 1.5rem;
        background-color: rgba(10, 10, 10, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .back-button {
        background: #1b1b1b;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #ffffff;
        font-size: 16px;
        padding: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
        margin-right: 0.25rem;
    }

    .back-button:hover {
        background-color: #222222;
        border-color: rgba(255, 255, 255, 0.16);
        opacity: 0.95;
    }

    h2 {
        font-size: 1.2rem;
        font-weight: 600;
        text-align: left;
        padding: 0;
        margin: 0;
        flex: 1;
        line-height: 1.2;
        letter-spacing: 0.01em;
    }
</style>
