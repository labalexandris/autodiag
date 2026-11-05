<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../lib/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const router = useRouter()
const route = useRoute()

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/'
    router.replace(next)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Αποτυχία σύνδεσης'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col justify-center bg-ink px-6 pt-safe pb-safe">
    <div class="mx-auto w-full max-w-sm">
      <div class="mb-8 flex items-center gap-3">
        <img src="/logo.svg" alt="" class="h-14 w-14" />
        <div>
          <h1 class="text-2xl font-extrabold text-white">AutoDiag</h1>
          <p class="text-sm text-slate-400">Διαχείριση συνεργείου</p>
        </div>
      </div>
      <form class="space-y-3 rounded-3xl bg-white p-5 shadow-xl" @submit.prevent="submit">
        <div>
          <label class="label" for="email">Email</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="username" required />
        </div>
        <div>
          <label class="label" for="pw">Κωδικός</label>
          <input id="pw" v-model="password" class="input" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{{ error }}</p>
        <button class="btn btn-primary w-full !py-3" :disabled="busy">{{ busy ? 'Σύνδεση…' : 'Σύνδεση' }}</button>
      </form>
    </div>
  </div>
</template>
