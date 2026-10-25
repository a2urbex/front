<script setup>
import Title from '@/components/Title.vue';
import { useUsersStore } from '@/stores/users';
import { computed, onMounted } from 'vue';

// Hub d'administration : outils regroupés par usage
const usersStore = useUsersStore();
const pending = computed(() => usersStore.users.filter((u) => Number(u.pending) === 1).length);

const SECTIONS = [
    { title: 'People', items: [{ to: '/admin/users', label: 'Access & users', icon: 'users', badge: true }] },
    {
        title: 'Spots',
        items: [
            { to: '/admin/importers', label: 'Importers', icon: 'file-import', hint: 'Commons, Wikidata, Flickr' },
            { to: '/admin/pinterest', label: 'Pinterest', icon: 'thumbtack' },
            { to: '/admin/imports', label: 'KML imports', icon: 'map-location-dot' },
            { to: '/admin/dedup', label: 'Deduplication', icon: 'layer-group' },
            { to: '/admin/sources', label: 'Sources', icon: 'database' },
        ],
    },
    { title: 'Communication', items: [{ to: '/admin/notify', label: 'Send a notification', icon: 'bell' }] },
];

onMounted(() => usersStore.getAll().catch(() => {}));
</script>

<template>
    <Title title="Administration" />
    <div class="ios-page ios-page--cols">
        <section v-for="s in SECTIONS" :key="s.title" class="ios-section">
            <h3 class="ios-header">{{ s.title }}</h3>
            <div class="ios-group">
                <router-link v-for="a in s.items" :key="a.to" class="ios-row" :to="a.to">
                    <span class="ios-icon"><font-awesome-icon :icon="['fas', a.icon]" /></span>
                    <span class="ios-row__label">{{ a.label }}</span>
                    <span v-if="a.hint" class="ios-row__value">{{ a.hint }}</span>
                    <span v-if="a.badge && pending" class="ios-badge">{{ pending }}</span>
                    <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
                </router-link>
            </div>
        </section>
    </div>
</template>
