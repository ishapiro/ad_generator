<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  projectId?: number
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [r2Key: string]
}>()

interface UploadedImage {
  id: number
  r2Key: string
  filename: string
  mimeType: string
}

const libraryImages = ref<UploadedImage[]>([])
const libraryLoading = ref(false)
const libraryError = ref<string | null>(null)
const search = ref('')
const uploading = ref(false)
const uploadError = ref<string | null>(null)

const filteredImages = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return libraryImages.value
  return libraryImages.value.filter(img => img.filename.toLowerCase().includes(q))
})

async function loadLibrary() {
  libraryLoading.value = true
  libraryError.value = null
  try {
    libraryImages.value = await $fetch<UploadedImage[]>('/api/media')
  } catch {
    libraryError.value = 'Failed to load images'
  } finally {
    libraryLoading.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    search.value = ''
    uploadError.value = null
    loadLibrary()
  }
})

function close() {
  emit('update:modelValue', false)
}

function pick(r2Key: string) {
  emit('select', r2Key)
}

async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  uploadError.value = null
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    if (props.projectId) fd.append('projectId', String(props.projectId))
    const record = await $fetch<UploadedImage>('/api/upload', { method: 'POST', body: fd })
    emit('select', record.r2Key)
  } catch (e: unknown) {
    uploadError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Upload failed'
        : 'Upload failed'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800">{{ title ?? 'Select Image' }}</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <!-- Upload strip -->
          <div class="flex items-center gap-3">
            <label
              class="cursor-pointer rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              :class="uploading ? 'pointer-events-none opacity-60' : ''"
            >
              {{ uploading ? 'Uploading…' : '+ Upload new image' }}
              <input
                type="file"
                accept="image/png,image/gif,image/jpeg,image/svg+xml"
                class="hidden"
                :disabled="uploading"
                @change="handleUpload"
              />
            </label>
            <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
          </div>

          <!-- Search -->
          <input
            v-model="search"
            type="search"
            placeholder="Search by filename…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <!-- Loading / error / empty -->
          <p v-if="libraryLoading" class="text-sm text-slate-500">Loading…</p>
          <p v-else-if="libraryError" class="text-sm text-red-600">{{ libraryError }}</p>
          <p v-else-if="filteredImages.length === 0" class="text-sm text-slate-500">No images found.</p>

          <!-- Grid -->
          <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            <button
              v-for="img in filteredImages"
              :key="img.id"
              type="button"
              class="group relative overflow-hidden rounded-lg border border-slate-200 transition-all hover:border-blue-400 hover:ring-2 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :title="img.filename"
              @click="pick(img.r2Key)"
            >
              <div style="aspect-ratio:1;overflow:hidden;">
                <img
                  :src="`/api/images/${img.r2Key}`"
                  :alt="img.filename"
                  style="display:block;width:100%;height:100%;object-fit:cover;max-width:none;"
                />
              </div>
              <div class="absolute inset-x-0 bottom-0 truncate bg-black/40 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {{ img.filename }}
              </div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            @click="close"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
