<script setup>
import Title from '@/components/Title.vue'
import { useUsersStore } from '@/stores/users'
import { computed, onMounted } from 'vue'

const usersStore = useUsersStore()

const isPending = (user) => Number(user.pending) === 1;
const pendingUsersCount = computed(() => usersStore.users.filter(isPending).length)

onMounted(async () => {
  try {
    await usersStore.getAll()
  } catch (error) {
    console.error('Failed to load users for dashboard:', error)
  }
})
</script>

<template>
  <Title title="Admin Hub" />

  <div class="admin-hub page-width">
    <div class="admin-hub__welcome">
      <h2>Administration Hub</h2>
      <p>Welcome to the administration control center. Select a section below to manage the platform.</p>
    </div>

    <div class="admin-hub__grid">
      <!-- Card 1: Users -->
      <router-link to="/admin/users" class="admin-hub__card">
        <div class="admin-hub__card-icon">
          <font-awesome-icon :icon="['fas', 'users']" />
        </div>
        <div class="admin-hub__card-content">
          <h3>Account Management</h3>
          <p>Approve pending access requests, manage user roles (Admin, Superuser, etc.), and supervise all registered users.</p>
        </div>
        <!-- Dynamic pending badge -->
        <div v-if="pendingUsersCount > 0" class="admin-hub__pending-badge">
          <span class="admin-hub__pending-pulse"></span>
          {{ pendingUsersCount }} pending
        </div>
        <div class="admin-hub__card-arrow">
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="arrow-icon" />
        </div>
      </router-link>

      <!-- Card 2: Imports -->
      <router-link to="/admin/imports" class="admin-hub__card">
        <div class="admin-hub__card-icon admin-hub__card-icon--imports">
          <font-awesome-icon :icon="['fas', 'map-location-dot']" />
        </div>
        <div class="admin-hub__card-content">
          <h3>Import Management</h3>
          <p>Import new KML or KMZ files to enrich your spatial maps. Configure your import options and view history.</p>
        </div>
        <div class="admin-hub__card-arrow">
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="arrow-icon" />
        </div>
      </router-link>

      <!-- Card 3: Geospatial Deduplication -->
      <router-link to="/admin/dedup" class="admin-hub__card">
        <div class="admin-hub__card-icon admin-hub__card-icon--dedup">
          <font-awesome-icon :icon="['fas', 'map-location-dot']" />
        </div>
        <div class="admin-hub__card-content">
          <h3>Geospatial Deduplication</h3>
          <p>Remove location points that are too close to each other using a fast spatial index. Watch progress live and stop at any time.</p>
        </div>
        <div class="admin-hub__card-arrow">
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="arrow-icon" />
        </div>
      </router-link>

      <!-- Card 4: Sources -->
      <router-link to="/admin/sources" class="admin-hub__card">
        <div class="admin-hub__card-icon admin-hub__card-icon--sources">
          <font-awesome-icon :icon="['fas', 'tags']" />
        </div>
        <div class="admin-hub__card-content">
          <h3>Source Manager</h3>
          <p>Create, rename, merge or delete the sources used to tag imported locations.</p>
        </div>
        <div class="admin-hub__card-arrow">
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="arrow-icon" />
        </div>
      </router-link>

      <!-- Card 5: Pinterest -->
      <router-link to="/admin/pinterest" class="admin-hub__card">
        <div class="admin-hub__card-icon admin-hub__card-icon--pinterest">
          <font-awesome-icon :icon="['fab', 'pinterest']" />
        </div>
        <div class="admin-hub__card-content">
          <h3>Pinterest Manager</h3>
          <p>Run and monitor the Pinterest board import, configure the schedule and choose the source for imported points.</p>
        </div>
        <div class="admin-hub__card-arrow">
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="arrow-icon" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.admin-hub {
  padding-top: 2rem;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;

  &__welcome {
    margin-bottom: 0.5rem;
    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(120deg, #fff 0%, rgba(#fff, 0.6) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      font-size: 0.95rem;
      color: #888;
      margin: 0;
      max-width: 600px;
      line-height: 1.6;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.8rem;
  }

  &__card {
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 2.5rem 2rem 2rem 2rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    text-decoration: none;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 10% 10%, rgba($primary, 0.03) 0%, transparent 50%);
      transition: opacity 0.4s ease;
      opacity: 0.5;
      z-index: 1;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba($primary, 0.3);
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);

      &::before {
        opacity: 1;
      }

      .admin-hub__card-arrow {
        color: $primary;
        transform: translateX(6px);
      }

      .admin-hub__card-icon {
        transform: scale(1.08);
        background: rgba($primary, 0.15);
        border-color: rgba($primary, 0.4);
        box-shadow: 0 0 15px rgba($primary, 0.15);
      }
    }

    &-icon {
      position: relative;
      z-index: 2;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: $primary;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      margin-bottom: 1.8rem;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

      &--imports {
        color: #4fc3f7; // A sleek spatial cyan/blue color
      }
    }

    &:hover .admin-hub__card-icon--imports {
      color: #fff;
      background: rgba(#4fc3f7, 0.15);
      border-color: rgba(#4fc3f7, 0.4);
      box-shadow: 0 0 15px rgba(#4fc3f7, 0.15);
    }

    &-icon--dedup {
      color: #a78bfa;
    }
    &:hover .admin-hub__card-icon--dedup {
      color: #fff;
      background: rgba(#a78bfa, 0.15);
      border-color: rgba(#a78bfa, 0.4);
      box-shadow: 0 0 15px rgba(#a78bfa, 0.15);
    }

    &-icon--sources {
      color: #f59e0b;
    }
    &:hover .admin-hub__card-icon--sources {
      color: #fff;
      background: rgba(#f59e0b, 0.15);
      border-color: rgba(#f59e0b, 0.4);
      box-shadow: 0 0 15px rgba(#f59e0b, 0.15);
    }

    &-icon--pinterest {
      color: #e60023;
    }
    &:hover .admin-hub__card-icon--pinterest {
      color: #fff;
      background: rgba(#e60023, 0.15);
      border-color: rgba(#e60023, 0.4);
      box-shadow: 0 0 15px rgba(#e60023, 0.15);
    }

    &-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      flex-grow: 1;

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #fff;
        margin: 0;
        letter-spacing: -0.01em;
      }

      p {
        font-size: 0.9rem;
        color: #a0a0a0;
        margin: 0 0 1.5rem 0;
        line-height: 1.55;
      }
    }

    &-arrow {
      position: relative;
      z-index: 2;
      margin-top: auto;
      align-self: flex-end;
      color: rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      font-size: 1.1rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      height: 1.6rem;
    }
  }

  &__pending-badge {
    position: absolute;
    bottom: 2rem;
    right: 3.75rem;
    z-index: 2;
    background: rgba(248, 113, 113, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: #f87171;
    padding: 0 0.75rem;
    height: 1.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    line-height: 1;
  }

  &__pending-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f87171;
    animation: pulse 1.6s infinite;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(248, 113, 113, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0);
  }
}

@media (max-width: 768px) {
  .admin-hub {
    padding-top: 1.5rem;
    gap: 1.8rem;

    &__welcome {
      h2 {
        font-size: 1.5rem;
      }
      p {
        font-size: 0.88rem;
      }
    }

    &__grid {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }

    &__card {
      padding: 2rem 1.5rem 1.5rem 1.5rem;

      &-icon {
        margin-bottom: 1.2rem;
      }
    }

    &__pending-badge {
      bottom: 1.5rem;
      right: 3.25rem;
    }
  }
}
</style>
