<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{ title: string; subtitle?: string; back?: string | boolean }>()
const router = useRouter()

function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="no-print sticky top-0 z-30 bg-ink text-white pt-safe">
    <div class="flex min-h-14 items-center gap-2 px-3 py-2">
      <button v-if="back" class="-ml-1 rounded-full p-1.5 hover:bg-white/10" aria-label="Πίσω" @click="goBack">
        <ChevronLeft :size="26" />
      </button>
      <div class="min-w-0 flex-1" :class="back ? '' : 'pl-1'">
        <h1 class="truncate text-lg leading-tight font-bold">{{ title }}</h1>
        <p v-if="subtitle" class="truncate text-xs text-slate-300">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </header>
</template>
