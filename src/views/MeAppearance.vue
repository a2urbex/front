<script setup>
import { ref } from 'vue';
import Title from '@/components/Title.vue';
import { ACCENTS, getAccent, setAccent } from '@/utilities/accent';
import { cardLayout, setCardLayout } from '@/utilities/cardLayout';

const LAYOUTS = [
    { key: 'staggered', label: 'Staggered', hint: 'Tall and wide photos, offset (default)' },
    { key: 'grid', label: 'Grid', hint: 'Same size for every card' },
];

// Couleur d'accent de l'app, par appareil
const current = ref(getAccent().key);
const choose = (key) => { current.value = setAccent(key).key; };
</script>

<template>
    <Title title="Appearance" />
    <div class="ios-page ios-page--cols">
        <section class="ios-section">
            <h3 class="ios-header">Accent colour</h3>
            <div class="ios-group" role="radiogroup" aria-label="Accent colour">
                <button v-for="a in ACCENTS" :key="a.key" class="ios-row" role="radio" :aria-checked="current === a.key" @click="choose(a.key)">
                    <span class="accent-dot" :style="{ background: a.tint }"></span>
                    <span class="ios-row__label">{{ a.label }}<template v-if="a.key === 'orange'"> (default)</template></span>
                    <font-awesome-icon v-if="current === a.key" class="accent-check" :icon="['fas', 'check']" />
                </button>
            </div>
            <p class="ios-footer">Used for buttons, tabs and highlights. Saved on this device only.</p>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Spot cards</h3>
            <div class="ios-group" role="radiogroup" aria-label="Spot cards layout">
                <button v-for="l in LAYOUTS" :key="l.key" class="ios-row layout-row" role="radio" :aria-checked="cardLayout === l.key" @click="setCardLayout(l.key)">
                    <span class="layout-icon" :class="`is-${l.key}`" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                    <span class="layout-row__text"><span>{{ l.label }}</span><small>{{ l.hint }}</small></span>
                    <font-awesome-icon v-if="cardLayout === l.key" class="accent-check" :icon="['fas', 'check']" />
                </button>
            </div>
            <p class="ios-footer">How spots are laid out in the list views.</p>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Preview</h3>
            <div class="ios-group accent-preview">
                <button class="ios-pill ios-pill--tint" type="button">Primary</button>
                <button class="ios-pill" type="button">Secondary</button>
                <span class="ios-switch on"></span>
                <a class="ios-row--link" style="color: var(--tint)">Link</a>
            </div>
        </section>
    </div>
</template>
