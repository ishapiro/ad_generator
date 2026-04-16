<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Projects</h1>
        <p class="mt-1 text-sm text-slate-500">Select a project to manage its ads and media.</p>
      </div>
      <button
        v-if="session?.role === 'admin'"
        type="button"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="showNewProject = true"
      >
        New Project
      </button>
    </div>

    <div v-if="pending" class="mt-10 text-center text-sm text-slate-500">Loading projects…</div>

    <div v-else-if="!projects || projects.length === 0" class="mt-10 text-center text-sm text-slate-500">
      No projects yet.
      <span v-if="session?.role === 'admin'"> Click <strong>New Project</strong> to create one.</span>
      <span v-else> Ask an admin to assign you to a project.</span>
    </div>

    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="p in projects"
        :key="p.id"
        :to="`/projects/${p.id}`"
        class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </div>
        <h2 class="font-semibold text-slate-900 group-hover:text-blue-700">{{ p.name }}</h2>
        <p v-if="p.description" class="mt-1 text-sm text-slate-500 line-clamp-2">{{ p.description }}</p>
        <span class="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:underline">Open →</span>
      </NuxtLink>
    </div>

    <!-- New project modal -->
    <div
      v-if="showNewProject"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showNewProject = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-slate-900">New Project</h2>
        <form class="mt-4 space-y-4" @submit.prevent="createProject">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              v-model="newName"
              type="text"
              required
              placeholder="Project name"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Description <span class="text-slate-400">(optional)</span></label>
            <input
              v-model="newDescription"
              type="text"
              placeholder="Short description"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              @click="showNewProject = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="creating || !newName.trim()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {{ creating ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const session = useState<{ id: number; email: string; name: string | null; role: string } | null>('auth-user')

const { data: projectsData, pending, refresh } = await useFetch<{
  projects: { id: number; name: string; description: string | null }[]
}>('/api/projects', { key: 'projects-index', server: false })

const projects = computed(() => projectsData.value?.projects ?? [])

const showNewProject = ref(false)
const newName = ref('')
const newDescription = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

async function createProject() {
  createError.value = null
  creating.value = true
  try {
    await $fetch('/api/admin/projects', {
      method: 'POST',
      body: { name: newName.value.trim(), description: newDescription.value.trim() || null },
    })
    showNewProject.value = false
    newName.value = ''
    newDescription.value = ''
    await refresh()
  } catch (e: unknown) {
    createError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to create project'
        : 'Failed to create project'
  } finally {
    creating.value = false
  }
}
</script>
