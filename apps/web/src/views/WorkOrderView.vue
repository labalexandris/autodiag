<script setup lang="ts">
import { Camera, Check, Cog, Package, Printer, Trash2, Wrench, X } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ContactButtons from '../components/ContactButtons.vue'
import PageHeader from '../components/PageHeader.vue'
import PlateBadge from '../components/PlateBadge.vue'
import Sheet from '../components/Sheet.vue'
import { api, del, get, patch, post } from '../lib/api'
import { auth } from '../lib/auth'
import { date, money, vehicleName, WO_STATUS, type WoStatus } from '../lib/format'
import { shrinkImage } from '../lib/image'
import { toast, toastError } from '../lib/toast'

const props = defineProps<{ id: string }>()
const router = useRouter()
const wo = ref<any>(null)
const saved = ref(false)

async function load() {
  wo.value = await get(`/work-orders/${props.id}`)
}
onMounted(load)

// ---- Αυτόματη αποθήκευση πεδίων (στο blur)
let savedTimer: number | undefined
async function save(fields: Record<string, unknown>) {
  try {
    const r = await patch(`/work-orders/${props.id}`, fields)
    Object.assign(wo.value, { status: r.status, ready_at: r.ready_at, delivered_at: r.delivered_at })
    saved.value = true
    clearTimeout(savedTimer)
    savedTimer = window.setTimeout(() => (saved.value = false), 1500)
  } catch (e) {
    toastError(e)
  }
}
const saveField = (key: string) => save({ [key]: key === 'odometer_km' ? wo.value[key] || null : wo.value[key] })

async function setStatus(s: WoStatus) {
  if (s === wo.value.status) return
  await save({ status: s })
  if (s === 'ready') toast('Έτοιμο! Ειδοποίησε τον πελάτη 📞')
}

// ---- Κωδικοί βλάβης
const dtcInput = ref('')
function addDtc() {
  const codes = dtcInput.value.toUpperCase().split(/[\s,;]+/).filter((c) => c.length >= 2)
  if (!codes.length) return
  wo.value.dtc_codes = [...new Set([...wo.value.dtc_codes, ...codes])]
  dtcInput.value = ''
  save({ dtc_codes: wo.value.dtc_codes })
}
function removeDtc(code: string) {
  wo.value.dtc_codes = wo.value.dtc_codes.filter((c: string) => c !== code)
  save({ dtc_codes: wo.value.dtc_codes })
}

// ---- Γραμμές
const subtotal = computed(() => (wo.value?.items ?? []).reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0))
const vat = computed(() => (subtotal.value * (wo.value?.vat_rate ?? 24)) / 100)

const itemOpen = ref(false)
const item = reactive({ id: '', kind: 'labor' as 'labor' | 'part', description: '', part_code: '', quantity: 1 as number | string, unit_price: '' as number | string })
const printIt = () => window.print()
function openItem(i?: any, kind: 'labor' | 'part' = 'labor') {
  Object.assign(item, i ? { ...i, part_code: i.part_code ?? '' } : { id: '', kind, description: '', part_code: '', quantity: 1, unit_price: '' })
  itemOpen.value = true
}
async function saveItem() {
  const body = {
    kind: item.kind,
    description: item.description,
    part_code: item.kind === 'part' ? item.part_code : null,
    quantity: Number(String(item.quantity).replace(',', '.')) || 1,
    unit_price: Number(String(item.unit_price).replace(',', '.')) || 0,
  }
  try {
    if (item.id) {
      const r = await patch(`/work-order-items/${item.id}`, body)
      const idx = wo.value.items.findIndex((x: any) => x.id === item.id)
      wo.value.items[idx] = r
    } else {
      wo.value.items.push(await post(`/work-orders/${props.id}/items`, body))
    }
    itemOpen.value = false
  } catch (e) {
    toastError(e)
  }
}
async function removeItem() {
  try {
    await del(`/work-order-items/${item.id}`)
    wo.value.items = wo.value.items.filter((x: any) => x.id !== item.id)
    itemOpen.value = false
  } catch (e) {
    toastError(e)
  }
}

// ---- Φωτογραφίες
const uploading = ref(0)
const viewer = ref<string | null>(null)
async function onFiles(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  for (const f of files) {
    uploading.value++
    try {
      const blob = await shrinkImage(f)
      const form = new FormData()
      form.append('file', blob, f.name.replace(/\.\w+$/, '') + (blob.type === 'image/jpeg' ? '.jpg' : ''))
      wo.value.attachments.push(await api(`/work-orders/${props.id}/attachments`, { form }))
    } catch (e) {
      toastError(e)
    } finally {
      uploading.value--
    }
  }
}
async function removePhoto(id: string) {
  if (!confirm('Διαγραφή φωτογραφίας;')) return
  await del(`/attachments/${id}`).catch(toastError)
  wo.value.attachments = wo.value.attachments.filter((a: any) => a.id !== id)
  viewer.value = null
}

async function removeWo() {
  if (!confirm(`Διαγραφή της κάρτας #${wo.value.number}; Δεν αναιρείται.`)) return
  try {
    await del(`/work-orders/${props.id}`)
    toast('Η κάρτα διαγράφηκε')
    router.replace('/work-orders')
  } catch (e) {
    toastError(e)
  }
}

const STEPS: WoStatus[] = ['open', 'in_progress', 'ready', 'delivered']
const viewerOpen = computed({ get: () => !!viewer.value, set: (v) => !v && (viewer.value = null) })
</script>

<template>
  <div v-if="wo">
    <PageHeader :title="`Κάρτα #${wo.number}`" :subtitle="`Άνοιξε ${date(wo.opened_at)}`" back="/work-orders">
      <template #actions>
        <span v-if="saved" class="flex items-center gap-1 text-xs font-semibold text-emerald-400"><Check :size="14" /> Αποθηκεύτηκε</span>
        <button class="rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Εκτύπωση" @click="printIt">
          <Printer :size="20" />
        </button>
      </template>
    </PageHeader>

    <!-- Εκτύπωση: κεφαλίδα συνεργείου -->
    <div class="hidden px-4 pt-4 print:block">
      <p class="text-xl font-bold">{{ auth.shop?.name }}</p>
      <p class="text-sm">{{ [auth.shop?.address, auth.shop?.phone, auth.shop?.vat_number && `ΑΦΜ ${auth.shop.vat_number}`].filter(Boolean).join(' · ') }}</p>
      <p class="mt-2 font-semibold">Δελτίο εργασίας #{{ wo.number }} — {{ date(wo.opened_at) }}</p>
    </div>

    <div class="space-y-4 p-4">
      <!-- Όχημα & πελάτης -->
      <section class="card p-4">
        <RouterLink :to="`/vehicles/${wo.vehicle.id}`" class="flex items-center gap-3">
          <PlateBadge :plate="wo.vehicle.plate" size="lg" />
          <div class="min-w-0">
            <p class="truncate font-bold">{{ vehicleName(wo.vehicle) }}</p>
            <p class="truncate text-xs text-slate-500">{{ [wo.vehicle.engine, wo.vehicle.fuel].filter(Boolean).join(' · ') }}</p>
          </div>
        </RouterLink>
        <div v-if="wo.customer" class="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
          <RouterLink :to="`/customers/${wo.customer.id}`" class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ wo.customer.full_name }}</p>
            <p class="text-sm text-slate-500">{{ wo.customer.phone }}</p>
          </RouterLink>
          <ContactButtons :phone="wo.customer.phone" class="no-print" />
        </div>
      </section>

      <!-- Κατάσταση -->
      <section class="no-print grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
        <button
          v-for="s in STEPS"
          :key="s"
          class="rounded-xl px-0.5 py-2.5 text-[11px] leading-tight font-bold tracking-tight transition"
          :class="wo.status === s ? (s === 'ready' ? 'bg-emerald-600 text-white' : 'bg-ink text-white') : 'text-slate-500'"
          @click="setStatus(s)"
        >
          {{ WO_STATUS[s].label }}
        </button>
      </section>

      <!-- Διάγνωση -->
      <section class="card space-y-4 p-4">
        <div>
          <label class="label" for="wo-km">Χιλιόμετρα</label>
          <input id="wo-km" v-model="wo.odometer_km" class="input" inputmode="numeric" placeholder="—" @blur="saveField('odometer_km')" />
        </div>
        <div>
          <label class="label" for="wo-complaint">Παράπονο πελάτη</label>
          <textarea id="wo-complaint" v-model="wo.complaint" class="input" rows="2" @blur="saveField('complaint')" />
        </div>
        <div>
          <label class="label" for="wo-dtc">Κωδικοί βλάβης (DTC)</label>
          <div class="flex flex-wrap gap-1.5" :class="{ 'mb-2': wo.dtc_codes.length }">
            <span v-for="c in wo.dtc_codes" :key="c" class="chip bg-amber-50 font-mono text-amber-900 ring-amber-300">
              {{ c }}
              <button class="no-print -mr-1 text-amber-600" :aria-label="`Αφαίρεση ${c}`" @click="removeDtc(c)"><X :size="14" /></button>
            </span>
          </div>
          <form class="no-print flex gap-2" @submit.prevent="addDtc">
            <input
              id="wo-dtc"
              v-model="dtcInput"
              class="input font-mono uppercase"
              placeholder="π.χ. P0300"
              autocapitalize="characters"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="btn btn-ghost shrink-0" :disabled="!dtcInput.trim()">Προσθήκη</button>
          </form>
        </div>
        <div>
          <label class="label" for="wo-diag">Διάγνωση / τι βρέθηκε</label>
          <textarea id="wo-diag" v-model="wo.diagnosis" class="input" rows="3" @blur="saveField('diagnosis')" />
        </div>
      </section>

      <!-- Εργασίες & ανταλλακτικά -->
      <section class="card overflow-hidden">
        <h2 class="px-4 pt-4 pb-2 font-bold">Εργασίες & ανταλλακτικά</h2>
        <ul class="divide-y divide-slate-100">
          <li v-for="i in wo.items" :key="i.id">
            <button class="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50" @click="openItem(i)">
              <component :is="i.kind === 'labor' ? Wrench : Package" :size="18" class="mt-0.5 shrink-0 text-slate-400" />
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ i.description }}</span>
                <span class="block text-xs text-slate-500">
                  {{ i.quantity }} × {{ money(i.unit_price) }}<template v-if="i.part_code"> · {{ i.part_code }}</template>
                </span>
              </span>
              <span class="font-semibold">{{ money(i.quantity * i.unit_price) }}</span>
            </button>
          </li>
        </ul>
        <div class="no-print grid grid-cols-2 gap-2 px-4 py-3">
          <button class="btn btn-ghost" @click="openItem(undefined, 'labor')"><Wrench :size="16" /> Εργασία</button>
          <button class="btn btn-ghost" @click="openItem(undefined, 'part')"><Package :size="16" /> Ανταλλακτικό</button>
        </div>
        <dl class="space-y-1 border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Καθαρή αξία</dt><dd>{{ money(subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">ΦΠΑ {{ wo.vat_rate }}%</dt><dd>{{ money(vat) }}</dd></div>
          <div class="flex justify-between pt-1 text-lg font-extrabold"><dt>Σύνολο</dt><dd>{{ money(subtotal + vat) }}</dd></div>
        </dl>
      </section>

      <!-- Φωτογραφίες -->
      <section class="card no-print p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-bold">Φωτογραφίες</h2>
          <label class="btn btn-ghost cursor-pointer !py-2 text-sm">
            <Camera :size="18" /> {{ uploading ? `Ανέβασμα… (${uploading})` : 'Προσθήκη' }}
            <input type="file" accept="image/*" multiple class="hidden" @change="onFiles" />
          </label>
        </div>
        <div v-if="wo.attachments.length" class="grid grid-cols-3 gap-2">
          <button v-for="a in wo.attachments" :key="a.id" class="aspect-square overflow-hidden rounded-xl bg-slate-100" @click="viewer = a.id">
            <img :src="`/api/attachments/${a.id}`" class="h-full w-full object-cover" loading="lazy" alt="" />
          </button>
        </div>
        <p v-else class="text-sm text-slate-500">Βγάλε φωτογραφία το καντράν, τη βλάβη ή το ανταλλακτικό.</p>
      </section>

      <!-- Εσωτερικά -->
      <section class="card no-print p-4">
        <label class="label" for="wo-int">Εσωτερικές σημειώσεις (δεν τυπώνονται)</label>
        <textarea id="wo-int" v-model="wo.internal_notes" class="input" rows="2" @blur="saveField('internal_notes')" />
      </section>

      <button class="no-print btn btn-danger w-full" @click="removeWo"><Trash2 :size="16" /> Διαγραφή κάρτας</button>
    </div>

    <!-- Γραμμή -->
    <Sheet v-model:open="itemOpen" :title="item.id ? 'Επεξεργασία' : item.kind === 'labor' ? 'Νέα εργασία' : 'Νέο ανταλλακτικό'">
      <form class="space-y-3" @submit.prevent="saveItem">
        <div class="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" class="rounded-lg py-2 text-sm font-semibold" :class="item.kind === 'labor' ? 'bg-white shadow' : 'text-slate-500'" @click="item.kind = 'labor'">
            <Cog :size="14" class="mr-1 inline" /> Εργασία
          </button>
          <button type="button" class="rounded-lg py-2 text-sm font-semibold" :class="item.kind === 'part' ? 'bg-white shadow' : 'text-slate-500'" @click="item.kind = 'part'">
            <Package :size="14" class="mr-1 inline" /> Ανταλλακτικό
          </button>
        </div>
        <div>
          <label class="label" for="it-desc">Περιγραφή *</label>
          <input id="it-desc" v-model="item.description" class="input" required autocomplete="off" />
        </div>
        <div v-if="item.kind === 'part'">
          <label class="label" for="it-code">Κωδικός ανταλλακτικού</label>
          <input id="it-code" v-model="item.part_code" class="input font-mono" autocomplete="off" spellcheck="false" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="it-qty">{{ item.kind === 'labor' ? 'Ώρες / τεμ.' : 'Ποσότητα' }}</label>
            <input id="it-qty" v-model="item.quantity" class="input" inputmode="decimal" />
          </div>
          <div>
            <label class="label" for="it-price">Τιμή μονάδας (€, χωρίς ΦΠΑ)</label>
            <input id="it-price" v-model="item.unit_price" class="input" inputmode="decimal" placeholder="0,00" />
          </div>
        </div>
        <button class="btn btn-primary w-full" :disabled="!item.description.trim()">Αποθήκευση</button>
        <button v-if="item.id" type="button" class="btn btn-danger w-full" @click="removeItem">Διαγραφή γραμμής</button>
      </form>
    </Sheet>

    <!-- Προβολή φωτογραφίας -->
    <Sheet v-model:open="viewerOpen" title="Φωτογραφία">
      <img v-if="viewer" :src="`/api/attachments/${viewer}`" class="w-full rounded-xl" alt="" />
      <button v-if="viewer" class="btn btn-danger mt-3 w-full" @click="removePhoto(viewer)"><Trash2 :size="16" /> Διαγραφή</button>
    </Sheet>
  </div>
</template>
