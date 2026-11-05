<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onBeforeUnmount, watch } from 'vue'

const open = defineModel<boolean>('open', { required: true })
defineProps<{ title: string }>()

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (open.value = false)
watch(open, (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (open.value) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition" leave-active-class="transition">
      <div v-if="open" class="fixed inset-0 z-50 bg-slate-900/50" @click="open = false" />
    </Transition>
    <Transition
      enter-from-class="translate-y-full sm:translate-y-8 sm:opacity-0"
      leave-to-class="translate-y-full sm:translate-y-8 sm:opacity-0"
      enter-active-class="transition duration-250 ease-out"
      leave-active-class="transition duration-200 ease-in"
    >
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:bottom-auto sm:top-[8vh] sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 class="text-lg font-bold">{{ title }}</h2>
          <button class="-mr-2 rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Κλείσιμο" @click="open = false">
            <X :size="22" />
          </button>
        </div>
        <div class="overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
