<script setup lang="ts">
import { MessageCircle, Phone } from 'lucide-vue-next'
import { telHref, viberHref } from '../lib/format'

defineProps<{ phone?: string | null }>()
</script>

<template>
  <div v-if="phone" class="flex gap-2">
    <a :href="telHref(phone)" class="btn btn-ghost !px-3 !py-2" aria-label="Κλήση" @click.stop>
      <Phone :size="18" />
    </a>
    <a :href="viberHref(phone)" class="btn btn-ghost !px-3 !py-2 !text-violet-700" aria-label="Viber" @click.stop>
      <MessageCircle :size="18" />
    </a>
  </div>
</template>
