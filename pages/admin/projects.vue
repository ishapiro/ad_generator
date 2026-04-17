<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <NuxtLink to="/admin" class="hover:text-slate-700">Admin</NuxtLink>
      <span>/</span>
      <span class="text-slate-900 font-medium">Projects</span>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Projects</h1>
      <button
        type="button"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="showNewProject = true"
      >
        New Project
      </button>
    </div>

    <div v-if="pending" class="mt-6 text-sm text-slate-500">Loading…</div>

    <div v-else class="mt-6 space-y-4">
      <div
        v-for="p in projects"
        :key="p.id"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-slate-900">{{ p.name }}</h2>
            <p v-if="p.description" class="mt-0.5 text-sm text-slate-500">{{ p.description }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              @click="openEdit(p)"
            >
              Edit
            </button>
            <button
              type="button"
              class="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
              @click="deleteProject(p.id, p.name)"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Members sub-section -->
        <div class="mt-4 border-t border-slate-100 pt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-700">Members</span>
            <button
              type="button"
              class="text-xs font-medium text-blue-600 hover:underline"
              @click="openAddMember(p.id)"
            >
              + Add member
            </button>
          </div>
          <div v-if="membersMap[p.id]?.length === 0" class="mt-2 text-xs text-slate-400">No members yet.</div>
          <ul v-else class="mt-2 space-y-1">
            <li
              v-for="m in membersMap[p.id]"
              :key="m.id"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-700">{{ m.name ?? m.email }} <span class="text-xs text-slate-400">({{ m.role }})</span></span>
              <button
                type="button"
                class="text-xs text-red-600 hover:underline"
                @click="removeMember(p.id, m.userId)"
              >
                Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
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
            <input v-model="newName" type="text" required placeholder="Project name"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Description <span class="text-slate-400">(optional)</span></label>
            <input v-model="newDescription" type="text" placeholder="Short description"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Templated API Key <span class="text-slate-400">(optional)</span></label>
            <input v-model="newTemplatedApiKey" type="text" placeholder="Templated.io API key"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="showNewProject = false">Cancel</button>
            <button type="submit" :disabled="creating || !newName.trim()" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50">{{ creating ? 'Creating…' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit project modal -->
    <div
      v-if="editProjectId !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="editProjectId = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-slate-900">Edit Project</h2>
        <form class="mt-4 space-y-4" @submit.prevent="saveEdit">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input v-model="editName" type="text" required placeholder="Project name"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Description <span class="text-slate-400">(optional)</span></label>
            <input v-model="editDescription" type="text" placeholder="Short description"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Templated API Key <span class="text-slate-400">(optional)</span></label>
            <input v-model="editTemplatedApiKey" type="text" placeholder="Templated.io API key"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="editProjectId = null">Cancel</button>
            <button type="submit" :disabled="saving || !editName.trim()" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50">{{ saving ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add member modal -->
    <div
      v-if="addMemberProjectId !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="addMemberProjectId = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-slate-900">Add Member</h2>
        <form class="mt-4 space-y-4" @submit.prevent="addMember">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">User</label>
            <select v-model="addMemberUserId" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select a user…</option>
              <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.name ?? u.email }} ({{ u.email }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select v-model="addMemberRole" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="editor">editor</option>
              <option value="owner">owner</option>
            </select>
          </div>
          <p v-if="addMemberError" class="text-sm text-red-600">{{ addMemberError }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="addMemberProjectId = null">Cancel</button>
            <button type="submit" :disabled="addingMember || !addMemberUserId" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50">{{ addingMember ? 'Adding…' : 'Add' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface ProjectRow {
  id: number
  name: string
  description: string | null
  templatedApiKey: string | null
}

interface MemberRow {
  id: number
  userId: number
  role: string
  email: string
  name: string | null
}

interface UserRow {
  id: number
  email: string
  name: string | null
}

const { data: projectsData, pending, refresh: refreshProjects } = await useFetch<{ projects: ProjectRow[] }>(
  '/api/admin/projects', { key: 'admin-projects', server: false },
)
const projects = computed(() => projectsData.value?.projects ?? [])

const { data: usersData } = await useFetch<{ users: UserRow[] }>('/api/admin/users', { key: 'admin-projects-users', server: false })
const allUsers = computed(() => usersData.value?.users ?? [])

const membersMap = ref<Record<number, MemberRow[]>>({})

async function loadMembers(projectId: number) {
  const res = await $fetch<{ members: MemberRow[] }>(`/api/admin/projects/${projectId}/members`)
  membersMap.value[projectId] = res.members
}

watch(projects, async (newProjects) => {
  for (const p of newProjects) {
    await loadMembers(p.id)
  }
}, { immediate: true })

// New project
const showNewProject = ref(false)
const newName = ref('')
const newDescription = ref('')
const newTemplatedApiKey = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

async function createProject() {
  createError.value = null
  creating.value = true
  try {
    await $fetch('/api/admin/projects', {
      method: 'POST',
      body: { name: newName.value.trim(), description: newDescription.value.trim() || null, templatedApiKey: newTemplatedApiKey.value.trim() || null },
    })
    showNewProject.value = false
    newName.value = ''
    newDescription.value = ''
    newTemplatedApiKey.value = ''
    await refreshProjects()
  } catch (e: unknown) {
    createError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to create project'
        : 'Failed to create project'
  } finally {
    creating.value = false
  }
}

async function deleteProject(id: number, name: string) {
  if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return
  await $fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
  await refreshProjects()
}

// Edit project
const editProjectId = ref<number | null>(null)
const editName = ref('')
const editDescription = ref('')
const editTemplatedApiKey = ref('')
const saving = ref(false)
const editError = ref<string | null>(null)

function openEdit(p: ProjectRow) {
  editProjectId.value = p.id
  editName.value = p.name
  editDescription.value = p.description ?? ''
  editTemplatedApiKey.value = p.templatedApiKey ?? ''
  editError.value = null
}

async function saveEdit() {
  if (!editProjectId.value) return
  editError.value = null
  saving.value = true
  try {
    await $fetch(`/api/admin/projects/${editProjectId.value}`, {
      method: 'PUT',
      body: { name: editName.value.trim(), description: editDescription.value.trim() || null, templatedApiKey: editTemplatedApiKey.value.trim() || null },
    })
    editProjectId.value = null
    await refreshProjects()
  } catch (e: unknown) {
    editError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to save project'
        : 'Failed to save project'
  } finally {
    saving.value = false
  }
}

// Add member
const addMemberProjectId = ref<number | null>(null)
const addMemberUserId = ref<number | ''>('')
const addMemberRole = ref('editor')
const addingMember = ref(false)
const addMemberError = ref<string | null>(null)

function openAddMember(projectId: number) {
  addMemberProjectId.value = projectId
  addMemberUserId.value = ''
  addMemberRole.value = 'editor'
  addMemberError.value = null
}

async function addMember() {
  if (!addMemberProjectId.value || !addMemberUserId.value) return
  addMemberError.value = null
  addingMember.value = true
  try {
    await $fetch(`/api/admin/projects/${addMemberProjectId.value}/members`, {
      method: 'POST',
      body: { userId: addMemberUserId.value, role: addMemberRole.value },
    })
    await loadMembers(addMemberProjectId.value)
    addMemberProjectId.value = null
  } catch (e: unknown) {
    addMemberError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to add member'
        : 'Failed to add member'
  } finally {
    addingMember.value = false
  }
}

async function removeMember(projectId: number, userId: number) {
  await $fetch(`/api/admin/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
  await loadMembers(projectId)
}
</script>
