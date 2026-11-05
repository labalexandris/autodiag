<script setup lang="ts">
withDefaults(defineProps<{ plate: string; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <!-- Ελληνική πινακίδα: λευκό φόντο, μπλε λωρίδα EU αριστερά -->
  <span
    class="inline-flex shrink-0 items-stretch overflow-hidden rounded-md bg-white font-mono font-bold tracking-wider text-slate-900 ring-1 ring-slate-400"
    :class="{ 'text-xs': size === 'sm', 'text-sm': size === 'md', 'text-xl': size === 'lg' }"
  >
    <span class="flex items-end bg-blue-700 px-1 pb-0.5 text-[8px] leading-none font-sans font-bold text-white">GR</span>
    <span :class="size === 'lg' ? 'px-3 py-1' : 'px-1.5 py-0.5'">{{ plate }}</span>
  </span>
</template>
