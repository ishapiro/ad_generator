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
            <div class="relative">
              <input
                v-model="editTemplatedApiKey"
                :type="showEditApiKey ? 'text' : 'password'"
                placeholder="key not set"
                class="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-9 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="onEditApiKeyInput"
                @change="testEditApiKey"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                tabindex="-1"
                @click="showEditApiKey = !showEditApiKey"
              >
                <!-- eye-off -->
                <svg v-if="showEditApiKey" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <!-- eye -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="editKeyStatus === 'testing'" class="mt-1 text-xs text-slate-500">Testing key…</p>
            <p v-else-if="editKeyStatus === 'valid'" class="mt-1 text-xs text-emerald-600">✓ Key is valid</p>
            <p v-else-if="editKeyStatus === 'invalid'" class="mt-1 text-xs text-red-600">✗ {{ editKeyStatusMessage }}</p>
            <button
              v-if="editTemplatedApiKey.trim()"
              type="button"
              class="mt-1 text-xs font-medium text-red-600 hover:underline"
              @click="editTemplatedApiKey = ''; editKeyStatus = null"
            >Clear key</button>
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
const showEditApiKey = ref(false)
const editKeyStatus = ref<'testing' | 'valid' | 'invalid' | null>(null)
const editKeyStatusMessage = ref('')
const saving = ref(false)
const editError = ref<string | null>(null)

function openEdit(p: ProjectRow) {
  editProjectId.value = p.id
  editName.value = p.name
  editDescription.value = p.description ?? ''
  editTemplatedApiKey.value = p.templatedApiKey ?? ''
  showEditApiKey.value = false
  editKeyStatus.value = null
  editError.value = null
}

function onEditApiKeyInput() {
  editKeyStatus.value = null
}

async function testEditApiKey() {
  const key = editTemplatedApiKey.value.trim()
  if (!key) { editKeyStatus.value = null; return }
  editKeyStatus.value = 'testing'
  try {
    const res = await $fetch<{ valid: boolean; message?: string }>('/api/templated/test-key', {
      method: 'POST',
      body: { apiKey: key },
    })
    editKeyStatus.value = res.valid ? 'valid' : 'invalid'
    editKeyStatusMessage.value = res.message ?? 'Invalid API key'
  } catch {
    editKeyStatus.value = 'invalid'
    editKeyStatusMessage.value = 'Could not reach Templated.io'
  }
}

async function saveEdit() {
  if (!editProjectId.value) return
  editError.value = null
  saving.value = true
  try {
    const key = editTemplatedApiKey.value.trim()
    if (key && editKeyStatus.value !== 'valid') {
      editKeyStatus.value = 'testing'
      const test = await $fetch<{ valid: boolean; message?: string }>('/api/templated/test-key', {
        method: 'POST',
        body: { apiKey: key },
      })
      editKeyStatus.value = test.valid ? 'valid' : 'invalid'
      editKeyStatusMessage.value = test.message ?? 'Invalid API key'
      if (!test.valid) {
        editError.value = 'Please enter a valid Templated.io API key before saving.'
        return
      }
    }
    await $fetch(`/api/admin/projects/${editProjectId.value}`, {
      method: 'PUT',
      body: { name: editName.value.trim(), description: editDescription.value.trim() || null, templatedApiKey: key || null },
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
