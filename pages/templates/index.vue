<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-700">← Back to Ad Configs</NuxtLink>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Choose a Template</h1>
        <p class="mt-1 text-sm text-slate-500">Select a Templated.io design to use as the base for your ad.</p>
      </div>
    </div>

    <div v-if="pending" class="text-slate-500">Loading templates…</div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      Failed to load templates: {{ error.message }}
    </div>

    <div v-else-if="!templates?.length" class="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
      <p class="text-slate-500">No templates found in your Templated.io account.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="tpl in templates"
        :key="tpl.id"
        :to="`/templates/${tpl.id}`"
        class="group block transition hover:opacity-90"
      >
        <img
          v-if="tpl.thumbnail"
          :src="tpl.thumbnail"
          :alt="tpl.name"
          class="block w-full h-auto rounded-xl shadow-sm"
        />
        <div v-else class="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">No preview</div>
        <p class="mt-2 font-semibold text-slate-900 group-hover:text-blue-600">{{ tpl.name }}</p>
        <p class="text-xs text-slate-400">
          {{ tpl.width ?? '?' }} × {{ tpl.height ?? '?' }}px
          <span v-if="tpl.layersCount" class="ml-2">{{ tpl.layersCount }} layers</span>
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TemplatedTemplate {
  id: string
  name: string
  thumbnail?: string
  width?: number
  height?: number
  layersCount?: number
  folderId?: string
}

const { data, pending, error } = await useFetch<TemplatedTemplate[]>('/api/templated/templates')
const templates = computed(() => data.value ?? [])
</script>
