<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <NuxtLink to="/admin" class="hover:text-slate-700">Admin</NuxtLink>
      <span>/</span>
      <span class="text-slate-900 font-medium">Users</span>
    </div>
    <h1 class="mt-4 text-2xl font-bold text-slate-900">Users</h1>

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

const currentUserId = computed(() => useState<{ id: number } | null>('auth-user').value?.id)

const { data, pending, refresh } = await useFetch<{ users: UserRow[] }>(
  '/api/admin/users', { key: 'admin-users', server: false },
)
const users = computed(() => data.value?.users ?? [])

async function updateRole(id: number, role: string) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PUT', body: { role } })
  await refresh()
}

async function toggleSuspend(u: UserRow) {
  await $fetch(`/api/admin/users/${u.id}`, { method: 'PUT', body: { suspended: !u.suspended } })
  await refresh()
}
</script>
