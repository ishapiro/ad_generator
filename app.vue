<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const dbOk = ref<boolean | null>(null)
onMounted(async () => {
  try {
    const r = await $fetch<{ ok: boolean }>('/api/health')
    dbOk.value = r.ok
  } catch {
    dbOk.value = false
  }
})
</script>
