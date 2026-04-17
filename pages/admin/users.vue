<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <NuxtLink to="/admin" class="hover:text-slate-700">Admin</NuxtLink>
      <span>/</span>
      <span class="font-medium text-slate-900">Users</span>
    </div>
    <div class="mt-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Users</h1>
      <button
        type="button"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        @click="showAddModal = true"
      >
        + Add User
      </button>
    </div>

    <div v-if="pending" class="mt-6 text-sm text-slate-500">Loading…</div>

    <div v-else class="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-4 py-3 text-left font-semibold text-slate-700">User</th>
            <th class="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
            <th class="px-4 py-3 text-left font-semibold text-slate-700">Projects</th>
            <th class="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th class="px-4 py-3 text-left font-semibold text-slate-700">Last login</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="font-medium text-slate-900">{{ u.name ?? '—' }}</div>
              <div class="text-slate-500">{{ u.email }}</div>
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.role"
                class="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                :disabled="u.id === currentUserId"
                @change="updateRole(u.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <div v-if="u.projects.length === 0" class="text-slate-400">None</div>
              <div v-else class="flex flex-wrap gap-1">
                <span
                  v-for="p in u.projects"
                  :key="p.projectId"
                  class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ p.projectName }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="u.suspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ u.suspended ? 'Suspended' : 'Active' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">
              {{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—' }}
            </td>
            <td class="px-4 py-3">
              <button
                v-if="u.id !== currentUserId"
                type="button"
                class="rounded-lg border px-3 py-1 text-xs font-medium transition-colors"
                :class="u.suspended
                  ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  : 'border-red-300 text-red-700 hover:bg-red-50'"
                @click="toggleSuspend(u)"
              >
                {{ u.suspended ? 'Unsuspend' : 'Suspend' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pending Invites -->
    <template v-if="invites.length > 0">
      <h2 class="mt-10 text-lg font-semibold text-slate-800">Pending Invites</h2>
      <p class="mt-1 text-sm text-slate-500">These users will be assigned to their projects automatically when they first sign in with Google.</p>
      <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Projects</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inv in invites" :key="inv.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-700">{{ inv.email }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="inv.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ inv.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div v-if="inv.projectNames.length === 0" class="text-slate-400">None</div>
                <div v-else class="flex flex-wrap gap-1">
                  <span
                    v-for="name in inv.projectNames"
                    :key="name"
                    class="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {{ name }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  @click="cancelInvite(inv.id)"
                >
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <!-- Add User Modal -->
  <div
    v-if="showAddModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="closeAddModal"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
      <h2 class="mb-4 text-lg font-semibold text-slate-900">Add User</h2>

      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Email <span class="text-red-500">*</span></label>
          <input
            v-model="addForm.email"
            type="email"
            placeholder="user@example.com"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select
            v-model="addForm.role"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Projects</label>
          <div v-if="allProjects.length === 0" class="text-sm text-slate-400">No projects available.</div>
          <div v-else class="space-y-2">
            <label
              v-for="p in allProjects"
              :key="p.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                :value="p.id"
                v-model="addForm.projectIds"
                class="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span class="text-sm text-slate-800">{{ p.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <p v-if="addError" class="mt-3 text-sm text-red-600">{{ addError }}</p>
      <p v-if="addSuccess" class="mt-3 text-sm text-emerald-600">{{ addSuccess }}</p>

      <div class="mt-5 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="closeAddModal"
        >
          {{ addSuccess ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="!addSuccess"
          type="button"
          :disabled="adding || !addForm.email.trim()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
          @click="submitAddUser"
        >
          {{ adding ? 'Adding…' : 'Add User' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface UserRow {
  id: number
  email: string
  name: string | null
  role: string
  suspended: boolean
  lastLoginAt: number | null
  projects: { projectId: number; projectName: string; role: string }[]
}

interface InviteRow {
  id: number
  email: string
  role: string
  projectIds: number[]
  projectNames: string[]
}

interface ProjectRow {
  id: number
  name: string
}

const currentUserId = computed(() => useState<{ id: number } | null>('auth-user').value?.id)

const [{ data, pending, refresh }, invitesRes, projectsRes] = await Promise.all([
  useFetch<{ users: UserRow[] }>('/api/admin/users', { key: 'admin-users', server: false }),
  useFetch<{ invites: InviteRow[] }>('/api/admin/users/invites', { key: 'admin-invites', server: false }),
  useFetch<{ projects: ProjectRow[] }>('/api/admin/projects', { key: 'admin-projects-list', server: false }),
])

const users = computed(() => data.value?.users ?? [])
const invites = ref<InviteRow[]>(invitesRes.data.value?.invites ?? [])
const allProjects = computed(() => projectsRes.data.value?.projects ?? [])

async function updateRole(id: number, role: string) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PUT', body: { role } })
  await refresh()
}

async function toggleSuspend(u: UserRow) {
  await $fetch(`/api/admin/users/${u.id}`, { method: 'PUT', body: { suspended: !u.suspended } })
  await refresh()
}

async function cancelInvite(id: number) {
  await $fetch(`/api/admin/users/invites/${id}`, { method: 'DELETE' })
  invites.value = invites.value.filter(i => i.id !== id)
}

// Add User modal
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref<string | null>(null)
const addSuccess = ref<string | null>(null)
const addForm = reactive({ email: '', role: 'member', projectIds: [] as number[] })

function closeAddModal() {
  showAddModal.value = false
  addError.value = null
  addSuccess.value = null
  addForm.email = ''
  addForm.role = 'member'
  addForm.projectIds = []
}

async function submitAddUser() {
  addError.value = null
  adding.value = true
  try {
    const res = await $fetch<{ status: string; invite?: { id: number; email: string }; user?: { email: string } }>(
      '/api/admin/users/invite',
      { method: 'POST', body: { email: addForm.email.trim(), role: addForm.role, projectIds: addForm.projectIds } },
    )
    if (res.status === 'invited') {
      addSuccess.value = `Invite created for ${res.invite!.email}. They'll be assigned to the selected projects when they first sign in.`
      const { data: fresh } = await useFetch<{ invites: InviteRow[] }>('/api/admin/users/invites', { key: 'admin-invites', server: false })
      invites.value = fresh.value?.invites ?? invites.value
    } else {
      addSuccess.value = `${res.user!.email} has been assigned to the selected projects.`
      await refresh()
    }
  } catch (e: unknown) {
    addError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to add user'
        : 'Failed to add user'
  } finally {
    adding.value = false
  }
}
</script>
