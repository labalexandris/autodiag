<script setup lang="ts">
import { WO_STATUS, type WoStatus } from '../lib/format'
defineProps<{ status: WoStatus }>()
</script>

<template>
  <span class="chip" :class="WO_STATUS[status].cls">{{ WO_STATUS[status].label }}</span>
</template>
