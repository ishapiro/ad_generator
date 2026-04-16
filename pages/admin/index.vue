<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <h1 class="text-2xl font-bold text-slate-900">Admin</h1>
    <p class="mt-1 text-sm text-slate-500">Manage users and projects.</p>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        to="/admin/users"
        class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 class="font-semibold text-slate-900 group-hover:text-blue-700">Users</h2>
        <p class="mt-1 text-sm text-slate-500">View all users, change roles, suspend accounts.</p>
        <span class="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:underline">Manage Users →</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/projects"
        class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </div>
        <h2 class="font-semibold text-slate-900 group-hover:text-emerald-700">Projects</h2>
        <p class="mt-1 text-sm text-slate-500">Create projects and assign users to them.</p>
        <span class="mt-4 inline-block text-sm font-medium text-emerald-600 group-hover:underline">Manage Projects →</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
</script>
