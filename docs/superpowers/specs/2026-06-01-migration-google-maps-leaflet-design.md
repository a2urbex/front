# Design — Migration Google Maps → Leaflet / OpenStreetMap

**Date :** 2026-06-01
**Statut :** Validé (en attente de relecture finale)

## Objectif

Remplacer entièrement le système de carte basé sur Google Maps par des
services 100 % gratuits (Leaflet + tuiles OpenStreetMap), **en conservant
exactement les mêmes fonctionnalités**.

## Contexte actuel

- **Stack** : Vue 3 (3.4.x) + Vite 6 + Pinia, npm.
- **Seule dépendance Google** : `vue3-google-map` (package.json:21).
- **Composant carte** : `src/components/Map.vue`
  - Carte interactive centrée sur la France (`{lat:46.71109, lng:1.7191036}`, zoom 6).
  - Markers personnalisés par catégorie (images PNG dans `/pins/pin-<cat>.png`).
  - Marker sélectionné : agrandi (20×27 → 26×36) + animation native `gm.maps.Animation.BOUNCE` + `zIndex` élevé.
  - Click sur marker → overlay (slider d'images, nom, catégorie, liens Waze + Google Maps, favoris, suppression admin/propriétaire).
- **Store** : `src/stores/map.js` charge les locations via API (`POST /location/map`, favoris) selon les filtres. Aucun appel à Google.
- **Clé API** : `VITE_MAPS_KEY` dans `.env` (vide) et `.env.local` (clé réelle).
- **Liens externes** vers `google.com/maps` : `Map.vue:144`, `LocationCardDisplay.vue:33-105`, `LocationView.vue:68`.
- **Pas de géocodage ni d'autocomplétion** Google → migration simplifiée.

## Décisions (validées avec l'utilisateur)

| Sujet | Décision |
|-------|----------|
| Fond de carte | Plan/rues OpenStreetMap standard |
| Fournisseur de tuiles | **Sans clé API** — tuiles OSM directes |
| Librairie | **Approche A** : `@vue-leaflet/vue-leaflet` (wrapper déclaratif Vue 3) |
| Liens externes Google Maps | **Conservés tels quels** (simples URLs, aucune API/clé Google) |
| Animation BOUNCE | **Réimplémentée en CSS** sur le marker sélectionné |

## Architecture cible

La migration est **isolée à la couche carte** de `Map.vue` et à son SCSS.
Toute la logique métier (store, overlay, favoris, suppression, watchers,
liens externes) reste inchangée.

### 1. Dépendances

- **Retirer** : `vue3-google-map` de `package.json`.
- **Ajouter** : `leaflet` (^1.9.4) et `@vue-leaflet/vue-leaflet` (^0.10.1).
- **Importer** `leaflet/dist/leaflet.css` globalement dans `src/main.js`.

### 2. `src/components/Map.vue` — couche carte

Remplacement du template `<GoogleMap><Marker/></GoogleMap>` par :

```html
<l-map :zoom="zoom" :center="center" :use-global-leaflet="false"
       style="width:100%;height:100%">
  <l-tile-layer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="© OpenStreetMap contributors"
    :max-zoom="19" />
  <l-marker v-for="item in mapStore.locations" :key="item.id"
            :lat-lng="[item.lat, item.lon]"
            :z-index-offset="isSelected(item) ? 1000 : 0"
            @click="displayOverlay(item)">
    <l-icon :icon-size="[20,27]" :icon-anchor="[10,27]"
            :class-name="pinClass(item)">
      <img :src="`/pins/pin-${item.categoryIcon || 'default'}.png`"
           :alt="item.name" class="map-pin-img" />
    </l-icon>
  </l-marker>
</l-map>
```

Côté `<script setup>` :

- `import { LMap, LTileLayer, LMarker, LIcon } from '@vue-leaflet/vue-leaflet';`
- `center` devient un **tableau** `[46.71109, 1.7191036]` (Leaflet),
  `zoom = 6` inchangé.
- **Supprimer** `const apiKey = import.meta.env.VITE_MAPS_KEY;`.
- **Supprimer** `getMarkerOptions()` (logique Google : `gm.maps.Animation`,
  `scaledSize`, `shape` poly) et la remplacer par deux helpers :
  - `isSelected(item)` → `itemSelected.value?.id === item.id`
  - `pinClass(item)` → `'map-pin' + (isSelected(item) ? ' map-pin--selected' : '')`
- `iconAnchor [10,27]` = bas-centre du pin (équivaut à l'anchor Google actuel).

> **Note d'implémentation** : la taille du marker sélectionné est gérée en
> CSS (scale), pas via `icon-size`, car la réactivité de `icon-size` dans
> `l-icon` est peu fiable. Le toggle de `class-name`, lui, est réactif.

### 3. Sélection + bounce → CSS (`src/assets/styles/components/map.scss`)

```scss
@keyframes pin-bounce {
  0%, 100% { transform: translateY(0)    scale(1.3); }
  50%      { transform: translateY(-12px) scale(1.3); }
}
.map-pin-img { transform-origin: bottom center; }
.map-pin--selected .map-pin-img { animation: pin-bounce .6s ease infinite; }
```

Le marker sélectionné est agrandi (scale 1.3 ≈ 20×27 → 26×36) **et** rebondit
en continu, reproduisant `Animation.BOUNCE` de Google.

> Vérifier que le conteneur `divIcon` généré par `l-icon` n'écrase pas
> `overflow`/`transform` (ajuster `.map-pin` si le rebond est rogné).

### 4. Nettoyage des variables d'environnement

- Retirer la ligne `VITE_MAPS_KEY=` de `.env`.
- Retirer la clé de `.env.local`.

### 5. Inchangé (ne pas toucher)

- `src/stores/map.js` (chargement locations, filtres, favoris).
- Overlay/modal : slider, nom, catégorie, favoris, suppression, watchers,
  `displayOverlay`.
- Liens externes Google Maps + Waze (`Map.vue`, `LocationCardDisplay.vue`,
  `LocationView.vue`).

## Stratégie de test / vérification

Vérification manuelle dans l'app (pas de tests automatisés sur la carte
actuellement) :

1. La carte s'affiche (tuiles OSM, attribution visible, centrée France zoom 6).
2. Les markers de catégorie apparaissent aux bonnes coordonnées.
3. Click sur un marker → overlay correct (image, nom, catégorie).
4. Le marker sélectionné est agrandi et rebondit.
5. Favoris, suppression (admin/propriétaire), liens Waze/Google fonctionnent.
6. Changement de filtres → markers mis à jour ; navigation → carte se ferme.
7. Aucune référence résiduelle à `VITE_MAPS_KEY` / `vue3-google-map` / `window.google`.

## Hors périmètre (YAGNI)

- Clustering de markers.
- Vue satellite / sélecteur de couches.
- Géocodage / autocomplétion d'adresses.
- Modification des liens externes.
