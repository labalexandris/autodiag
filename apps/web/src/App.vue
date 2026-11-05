<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import Toasts from './components/Toasts.vue'
import { auth } from './lib/auth'

const route = useRoute()
const showNav = computed(() => !!auth.user && !route.meta.public)
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-2xl" :class="showNav ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : ''">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </div>
  <BottomNav v-if="showNav" />
  <Toasts />
</template>
