<script setup lang="ts">
import { toasts } from '../lib/toast'
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
    <TransitionGroup
      enter-from-class="-translate-y-3 opacity-0"
      leave-to-class="-translate-y-3 opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
        :class="t.kind === 'error' ? 'bg-rose-600 text-white' : 'bg-ink text-white'"
        role="status"
      >
        {{ t.text }}
      </div>
    </TransitionGroup>
  </div>
</template>
