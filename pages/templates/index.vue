<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <NuxtLink to="/ads" class="text-sm text-slate-500 hover:text-slate-700">← Back to Ad Profiles</NuxtLink>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Choose a Template</h1>
        <p class="mt-1 text-sm text-slate-500">
          Templates define the visual layout of your ad — where headlines, images, and other elements are positioned.
          Select one to configure its content and create a new Ad Profile.
        </p>
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
        <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            v-if="tpl.thumbnail && tpl.thumbnailReady"
            :src="tpl.thumbnail"
            :alt="tpl.name"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
          <div v-else-if="tpl.thumbnail && !tpl.thumbnailReady" class="thumbnail-empty" style="background:#fffbeb; color:#b45309;">
            Thumbnail generating — please wait, then refresh.
          </div>
          <div v-else class="thumbnail-empty">No preview</div>
        </div>
        <p class="mt-2 font-semibold text-slate-900 group-hover:text-blue-600">{{ tpl.name }}</p>
        <p class="text-xs text-slate-400">
          {{ tpl.width ?? '?' }} × {{ tpl.height ?? '?' }}px
          <span v-if="tpl.layersCount" class="ml-2">· {{ tpl.layersCount }} layers</span>
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
  thumbnailReady?: boolean
  width?: number
  height?: number
  layersCount?: number
  folderId?: string
}

const { data, pending, error } = await useFetch<TemplatedTemplate[]>('/api/templated/templates')
const templates = computed(() => data.value ?? [])
</script>

<style scoped>
.thumbnail-wrap {
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.thumbnail-img {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
}

.thumbnail-empty {
  display: flex;
  height: 12rem;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>
