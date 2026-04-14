<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-slate-900">Ad Generator</h1>
      <NuxtLink
        to="/ads/new"
        class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        New Ad Config
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-slate-500">Loading…</div>

    <div v-else-if="!adConfigs?.length" class="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
      <p class="text-slate-500">No ad configs yet.</p>
      <NuxtLink to="/ads/new" class="mt-3 inline-block text-blue-600 hover:underline">
        Create your first ad config →
      </NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="config in adConfigs"
        :key="config.id"
        class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
      >
        <div>
          <p class="font-semibold text-slate-900">{{ config.name }}</p>
          <p class="mt-0.5 text-sm text-slate-500">{{ config.headline }}</p>
          <p class="text-xs text-slate-400">
            Created {{ new Date(config.createdAt ?? '').toLocaleDateString() }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/ads/${config.id}`"
            class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit
          </NuxtLink>
          <button
            type="button"
            class="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="generatingId === config.id"
            @click="quickGenerate(config.id)"
          >
            {{ generatingId === config.id ? 'Generating…' : 'Generate' }}
          </button>
          <button
            type="button"
            class="rounded px-2 py-1.5 text-sm text-red-500 hover:bg-red-50"
            @click="deleteConfig(config.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdConfig {
  id: number
  name: string
  headline: string
  createdAt: Date | null
}

const { data, pending, refresh } = await useFetch<{ adConfigs: AdConfig[] }>('/api/ad-configs')
const adConfigs = computed(() => data.value?.adConfigs ?? [])

const generatingId = ref<number | null>(null)

async function quickGenerate(id: number) {
  generatingId.value = id
  try {
    await $fetch(`/api/ad-configs/${id}/generate`, { method: 'POST' })
    navigateTo(`/ads/${id}`)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Generation failed'
    alert(message)
  } finally {
    generatingId.value = null
  }
}

async function deleteConfig(id: number) {
  if (!confirm('Delete this ad config and all its generated ads?')) return
  await $fetch(`/api/ad-configs/${id}`, { method: 'DELETE' })
  refresh()
}
</script>
