<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div v-if="pending" class="text-sm text-slate-500">Loading…</div>

    <template v-else-if="project">
      <!-- Header -->
      <div class="flex items-center gap-2 text-sm text-slate-500">
        <NuxtLink to="/" class="hover:text-slate-700">Projects</NuxtLink>
        <span>/</span>
        <span class="text-slate-900 font-medium">{{ project.name }}</span>
      </div>

      <div class="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ project.name }}</h1>
          <p v-if="project.description" class="mt-1 text-sm text-slate-500">{{ project.description }}</p>
        </div>
      </div>

      <!-- Action cards -->
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Ad Profiles -->
        <NuxtLink
          :to="`/ads?projectId=${project.id}`"
          class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900 group-hover:text-blue-700">Ad Profiles</h2>
          <p class="mt-1 text-sm text-slate-500">Create and manage ad profiles for this project.</p>
          <span class="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:underline">Open →</span>
        </NuxtLink>

        <!-- Media Library -->
        <NuxtLink
          :to="`/media?projectId=${project.id}`"
          class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900 group-hover:text-emerald-700">Media Library</h2>
          <p class="mt-1 text-sm text-slate-500">Upload and organize images for this project.</p>
          <span class="mt-4 inline-block text-sm font-medium text-emerald-600 group-hover:underline">Open →</span>
        </NuxtLink>

        <!-- templated.io -->
        <a
          href="https://app.templated.io"
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900 group-hover:text-violet-700">templated.io</h2>
          <p class="mt-1 text-sm text-slate-500">Design ad templates in the Templated.io visual editor.</p>
          <span class="mt-4 inline-block text-sm font-medium text-violet-600 group-hover:underline">Open ↗</span>
        </a>
      </div>
    </template>

    <div v-else class="mt-10 text-center text-sm text-slate-500">Project not found.</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const idParam = computed(() => route.params.id as string)

const { data, pending } = await useFetch<{
  project: { id: number; name: string; description: string | null } | null
}>(() => `/api/projects/${idParam.value}`, { key: () => `project-${idParam.value}`, server: false })

const project = computed(() => data.value?.project ?? null)
</script>
