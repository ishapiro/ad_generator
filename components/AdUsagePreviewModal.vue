<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  filename: string
  usedInProfiles: Array<{ id: number; name: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

interface UsageEntry {
  adConfigId: number
  profileName: string
  r2Key: string | null
  createdAt: string | null
}

const usages = ref<UsageEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

watch(() => props.modelValue, async (open) => {
  if (!open) return
  loading.value = true
  error.value = null
  usages.value = []
  try {
    const ids = props.usedInProfiles.map(p => p.id).join(',')
    usages.value = await $fetch<UsageEntry[]>(`/api/media/usages?ids=${ids}`)
  } catch {
    error.value = 'Failed to load usage previews'
  } finally {
    loading.value = false
  }
})

function close() {
  emit('update:modelValue', false)
}

function formatDate(raw: string | null) {
  if (!raw) return ''
  const d = new Date(raw)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">Ad Usage</h2>
            <p class="mt-0.5 truncate text-sm text-slate-500" :title="filename">{{ filename }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5">
          <p v-if="loading" class="text-sm text-slate-500">Loading…</p>
          <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

          <div v-else class="space-y-4">
            <div
              v-for="entry in usages"
              :key="entry.adConfigId"
              class="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <!-- Ad image or placeholder -->
              <div style="width:120px;flex-shrink:0;overflow:hidden;border-radius:0.5rem;border:1px solid #e2e8f0;background:#f8fafc;">
                <img
                  v-if="entry.r2Key"
                  :src="`/api/images/${entry.r2Key}`"
                  :alt="entry.profileName"
                  style="display:block;width:100%;height:auto;max-width:none;"
                />
                <div
                  v-else
                  style="width:120px;height:90px;display:flex;align-items:center;justify-content:center;"
                  class="text-center text-xs text-slate-400"
                >
                  No ad<br>generated yet
                </div>
              </div>

              <!-- Info -->
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <NuxtLink
                  :to="`/ads/${entry.adConfigId}`"
                  class="text-sm font-semibold text-blue-600 hover:underline"
                  @click="close"
                >
                  {{ entry.profileName }}
                </NuxtLink>
                <p v-if="entry.r2Key && entry.createdAt" class="text-xs text-slate-500">
                  Latest generation: {{ formatDate(entry.createdAt) }}
                </p>
                <p v-else class="text-xs text-slate-400 italic">No completed generations</p>
                <NuxtLink
                  :to="`/ads/${entry.adConfigId}`"
                  class="mt-1 self-start rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  @click="close"
                >
                  View ad profile →
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            @click="close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
