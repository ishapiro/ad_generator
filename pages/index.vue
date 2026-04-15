<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-slate-900">Ad Profiles</h1>
      <NuxtLink
        to="/templates"
        class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + New Ad Profile
      </NuxtLink>
    </div>

    <p class="mb-8 max-w-2xl text-sm text-slate-500">
      Ad Profiles use <strong class="font-medium text-slate-700">Templated.io</strong> templates to define the layout of your ad — where headlines, images, and other elements appear.
      Each profile stores a template selection plus default field values (text copy and AI image prompts).
      From any profile you can generate ad images, adjust content, and regenerate as many times as you like.
    </p>

    <div v-if="pending" class="text-slate-500">Loading…</div>

    <div v-else-if="!adConfigs?.length" class="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
      <p class="text-slate-500">No ad profiles yet.</p>
      <NuxtLink to="/templates" class="mt-3 inline-block text-blue-600 hover:underline">
        Create your first ad profile →
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
          <NuxtLink
            :to="`/ads/${config.id}?showGenerated=true`"
            class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Completed
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
  if (!confirm('Delete this ad profile and all its generated ads?')) return
  await $fetch(`/api/ad-configs/${id}`, { method: 'DELETE' })
  refresh()
}
</script>
