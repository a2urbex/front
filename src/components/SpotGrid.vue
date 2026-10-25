<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LocationCard from '@/components/LocationCard.vue';
import { cardLayout } from '@/utilities/cardLayout';

// Grille des points : quinconce (colonnes indépendantes, cartes hautes et basses en damier) ou grille régulière.
// Les colonnes sont remplies dans l'ordre (i % n) : ajouter une page ne réordonne pas les cartes déjà là.
const props = defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['open-location']);

const el = ref(null);
const cols = ref(2);
let ro = null;
const measure = () => {
  const w = el.value?.clientWidth || 0;
  cols.value = window.innerWidth < 990 ? 2 : Math.max(2, Math.floor(w / 220));
};
onMounted(() => {
  measure();
  ro = new ResizeObserver(measure);
  if (el.value) ro.observe(el.value);
});
onBeforeUnmount(() => ro?.disconnect());

const columns = computed(() => {
  const out = Array.from({ length: cols.value }, () => []);
  props.items.forEach((item, i) => {
    const c = i % cols.value;
    // damier : une carte haute, une basse, décalées d'une colonne à l'autre
    out[c].push({ item, tall: (c + Math.floor(i / cols.value)) % 2 === 0 });
  });
  return out;
});
</script>

<template>
  <div ref="el" class="locations-container" :class="cardLayout === 'grid' ? 'is-grid' : 'is-staggered'" :style="{ '--cols': cols }">
    <template v-if="cardLayout === 'grid'">
      <LocationCard v-for="item in items" :key="item.id" :location="item" @open-location="emit('open-location', $event)" />
    </template>
    <template v-else>
      <div v-for="(col, c) in columns" :key="c" class="spot-col">
        <LocationCard v-for="cell in col" :key="cell.item.id" :location="cell.item" :tall="cell.tall" @open-location="emit('open-location', $event)" />
      </div>
    </template>
  </div>
</template>
