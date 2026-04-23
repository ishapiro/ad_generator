<template>
  <div class="space-y-3">
    <!-- Mode toggle -->
    <div class="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
      <button
        type="button"
        class="flex-1 rounded-md py-1.5 transition"
        :class="mode === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        @click="mode = 'generate'"
      >
        AI Prompt
      </button>
      <button
        type="button"
        class="flex-1 rounded-md py-1.5 transition"
        :class="mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        @click="mode = 'upload'"
      >
        Upload / Library
      </button>
    </div>

    <!-- ── AI Prompt mode ── -->
    <template v-if="mode === 'generate'">
      <textarea
        :value="localPrompt"
        rows="3"
        :placeholder="`Describe the image for '${layerName}'…`"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @input="localPrompt = ($event.target as HTMLTextAreaElement).value"
      />

      <!-- Saved prompt toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Picker -->
        <div class="relative">
          <div v-if="showPicker" class="fixed inset-0 z-10" @click="showPicker = false" />
          <button
            type="button"
            class="relative z-20 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            @click="showPicker = !showPicker"
          >
            Saved Prompts
            <span v-if="savedPrompts.length" class="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {{ savedPrompts.length }}
            </span>
          </button>

          <div
            v-if="showPicker"
            class="absolute left-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div class="max-h-60 overflow-y-auto">
              <div v-if="!savedPrompts.length" class="px-4 py-6 text-center text-sm text-slate-400">
                No saved prompts yet.
              </div>
              <div
                v-for="p in savedPrompts"
                :key="p.id"
                class="group flex items-start gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0"
              >
                <button type="button" class="flex-1 text-left" @click="selectPrompt(p.prompt)">
                  <p class="text-sm font-medium text-slate-800 group-hover:text-blue-600">{{ p.name }}</p>
                  <p class="mt-0.5 line-clamp-2 text-xs text-slate-400">{{ p.prompt }}</p>
                </button>
                <button
                  type="button"
                  class="mt-0.5 shrink-0 text-slate-300 hover:text-red-500"
                  title="Delete prompt"
                  @click.stop="deletePrompt(p.id)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Save current prompt -->
        <template v-if="!showSaveForm">
          <button
            type="button"
            :disabled="!localPrompt.trim()"
            class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            @click="showSaveForm = true"
          >
            Save Prompt
          </button>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <input
              v-model="savePromptName"
              type="text"
              placeholder="Prompt name…"
              autofocus
              class="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              @keydown.enter.prevent="savePrompt"
              @keydown.escape="showSaveForm = false"
            />
            <button
              type="button"
              :disabled="saving || !savePromptName.trim()"
              class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              @click="savePrompt"
            >
              {{ saving ? '…' : 'Save' }}
            </button>
            <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="showSaveForm = false">
              Cancel
            </button>
          </div>
        </template>
      </div>
    </template>

    <!-- ── Upload / Library mode ── -->
    <template v-else>
      <!-- Currently selected image preview -->
      <div
        v-if="localR2Key"
        class="overflow-hidden rounded-lg border"
        :class="selectedImageBroken ? 'border-red-300' : 'border-slate-200'"
      >
        <div
          class="relative"
          style="background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px"
        >
          <img
            :src="`/api/images/${localR2Key}`"
            alt="Selected image"
            class="max-h-48 w-full object-contain"
            @load="selectedImageBroken = false"
            @error="selectedImageBroken = true"
          />
          <div v-if="selectedImageBroken" class="flex items-center gap-2 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span class="font-medium">Image not found.</span> Please re-select from the library below.
          </div>
          <button
            type="button"
            class="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow hover:bg-white"
            @click="clearUpload"
          >
            Remove
          </button>
        </div>

        <!-- AI fit button -->
        <div v-if="fitLabel && !selectedImageBroken" class="flex items-center gap-2 border-t border-slate-100 px-3 py-2">
          <button
            type="button"
            :disabled="fitting"
            class="flex items-center gap-1.5 rounded-md bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100 disabled:pointer-events-none disabled:opacity-50"
            @click="fitToLayer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            {{ fitting ? 'Fitting…' : `Fit to ${fitLabel} with AI` }}
          </button>
          <p v-if="fitError" class="text-xs text-red-600">{{ fitError }}</p>
        </div>
      </div>

      <!-- Library grid -->
      <div v-if="libraryImages.length" class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-slate-500">
            Previously uploaded
            <span class="text-slate-400">({{ filteredLibraryImages.length }}<template v-if="librarySearch"> of {{ libraryImages.length }}</template>)</span>
          </p>
        </div>
        <input
          v-model="librarySearch"
          type="search"
          placeholder="Search by filename…"
          class="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p v-if="deleteError" class="text-xs text-red-600">{{ deleteError }}</p>
        <div class="max-h-72 overflow-y-auto rounded-lg">
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="img in filteredLibraryImages"
              :key="img.id"
              class="group relative aspect-square overflow-hidden rounded-lg border-2 transition"
              :class="localR2Key === img.r2Key
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-slate-200 hover:border-blue-400'"
              style="background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 10px 10px"
            >
              <!-- Select button -->
              <button
                type="button"
                class="h-full w-full"
                :title="img.filename"
                @click="selectLibraryImage(img.r2Key)"
              >
                <img
                  :src="`/api/images/${img.r2Key}`"
                  :alt="img.filename"
                  class="h-full w-full object-cover"
                />
              </button>

              <!-- Selected checkmark -->
              <div
                v-if="localR2Key === img.r2Key"
                class="pointer-events-none absolute inset-0 flex items-end justify-start bg-blue-500/20 p-1"
              >
                <span class="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">✓</span>
              </div>

              <!-- Delete button (only when no other profile uses this image) -->
              <button
                v-if="canDelete(img)"
                type="button"
                class="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-red-500 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
                title="Delete image"
                @click.stop="deleteLibraryImage(img)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
              <!-- In-use lock (shown instead of delete when other profiles reference this image) -->
              <div
                v-else-if="img.usedInProfiles.length > 0"
                class="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                :title="`Used by ${img.usedInProfiles.length} ad profile${img.usedInProfiles.length === 1 ? '' : 's'} — cannot delete`"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <p v-if="filteredLibraryImages.length === 0 && librarySearch" class="py-4 text-center text-xs text-slate-400">
            No images match "{{ librarySearch }}"
          </p>
        </div>
      </div>

      <!-- Upload new -->
      <div>
        <p class="mb-1.5 text-xs font-medium text-slate-500">Upload new image</p>
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50"
          :class="uploading ? 'pointer-events-none opacity-60' : ''"
        >
          <span class="text-xl">{{ uploading ? '⏳' : '📁' }}</span>
          <span>{{ uploading ? 'Uploading…' : 'Click to choose a file' }}</span>
          <span class="text-xs text-slate-400">PNG, GIF, JPEG, or SVG</span>
          <input
            type="file"
            accept="image/png,image/gif,image/jpeg,image/svg+xml"
            class="hidden"
            :disabled="uploading"
            @change="handleFileChange"
          />
        </label>
        <p v-if="uploadError" class="mt-1 text-xs text-red-600">{{ uploadError }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface SavedPrompt {
  id: number
  name: string
  prompt: string
}

interface UploadedImage {
  id: number
  r2Key: string
  filename: string
  mimeType: string
  usedInProfiles: Array<{ id: number; name: string }>
  createdAt: Date | null
}

const props = defineProps<{
  layerName: string
  prompt: string
  r2Key: string
  imageMode: 'generate' | 'upload'
  savedPrompts: SavedPrompt[]
  profileId?: number
  projectId?: number
  layerWidth?: number
  layerHeight?: number
}>()

const emit = defineEmits<{
  'update:prompt': [value: string]
  'update:r2Key': [value: string]
  'update:imageMode': [value: 'generate' | 'upload']
  'prompt-saved': [prompt: SavedPrompt]
  'prompt-deleted': [id: number]
}>()

const mode = computed({
  get: () => props.imageMode,
  set: (v) => emit('update:imageMode', v),
})

const localPrompt = computed({
  get: () => props.prompt,
  set: (v) => emit('update:prompt', v),
})

const selectedImageBroken = ref(false)

const localR2Key = computed({
  get: () => props.r2Key,
  set: (v) => { selectedImageBroken.value = false; emit('update:r2Key', v) },
})

// ── Image library ──
const libraryImages = ref<UploadedImage[]>([])
const librarySearch = ref('')

const filteredLibraryImages = computed(() => {
  const q = librarySearch.value.trim().toLowerCase()
  if (!q) return libraryImages.value
  return libraryImages.value.filter(img => img.filename.toLowerCase().includes(q))
})

function canDelete(img: UploadedImage): boolean {
  if (img.usedInProfiles.length === 0) return true
  // Allow delete if the only referencing profile is the current one
  if (props.profileId && img.usedInProfiles.every(p => p.id === props.profileId)) return true
  return false
}

async function loadLibrary() {
  try {
    libraryImages.value = await $fetch<UploadedImage[]>('/api/media')
  } catch {
    // non-fatal
  }
}

watch(mode, (m) => { if (m === 'upload') loadLibrary() }, { immediate: true })

function selectLibraryImage(r2Key: string) {
  localR2Key.value = r2Key
}

function clearUpload() {
  localR2Key.value = ''
}

const deleteError = ref('')

// ── AI fit to layer dimensions ──
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

const fitLabel = computed(() => {
  if (!props.layerWidth || !props.layerHeight) return ''
  const d = gcd(props.layerWidth, props.layerHeight)
  const rw = props.layerWidth / d
  const rh = props.layerHeight / d
  return rw <= 20 && rh <= 20 ? `${rw}:${rh}` : `${props.layerWidth}×${props.layerHeight}`
})

const fitting = ref(false)
const fitError = ref('')

async function fitToLayer() {
  if (!localR2Key.value || !props.layerWidth || !props.layerHeight) return
  fitting.value = true
  fitError.value = ''
  try {
    const res = await $fetch<{ r2Key: string; url: string }>('/api/ai/revise-image', {
      method: 'POST',
      body: {
        r2Key: localR2Key.value,
        instructions: `Adapt this image to fill a ${props.layerWidth}×${props.layerHeight} canvas (${fitLabel.value} aspect ratio). Keep the main subject centered and fully visible. Extend or crop the background naturally to fill any extra space. Do not add text, logos, or watermarks.`,
        provider: 'gemini',
        projectId: props.projectId,
      },
    })
    localR2Key.value = res.r2Key
  } catch (e: unknown) {
    fitError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Fit failed'
        : 'Fit failed'
  } finally {
    fitting.value = false
  }
}

async function deleteLibraryImage(img: UploadedImage) {
  if (!confirm(`Delete "${img.filename}"? This cannot be undone.`)) return
  deleteError.value = ''
  try {
    const params = props.profileId ? `?excludeProfileId=${props.profileId}` : ''
    await $fetch(`/api/uploads/${img.id}${params}`, { method: 'DELETE' })
    libraryImages.value = libraryImages.value.filter(i => i.id !== img.id)
    if (localR2Key.value === img.r2Key) localR2Key.value = ''
  } catch (e: unknown) {
    deleteError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to delete image.'
        : 'Failed to delete image.'
  }
}

// ── File upload ──
const uploading = ref(false)
const uploadError = ref('')

const ALLOWED_TYPES = ['image/png', 'image/gif', 'image/jpeg', 'image/svg+xml']

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploadError.value = ''

  if (!ALLOWED_TYPES.includes(file.type)) {
    uploadError.value = 'Only PNG, GIF, and JPEG images are supported. Export your logo as PNG with a transparent background.'
    return
  }

  await uploadFile(file)
}

async function uploadFile(file: File) {
  uploading.value = true
  uploadError.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const record = await $fetch<UploadedImage>('/api/upload', { method: 'POST', body: fd })
    localR2Key.value = record.r2Key
    libraryImages.value.unshift(record)
  } catch {
    uploadError.value = 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

// ── Saved prompt picker ──
const showPicker = ref(false)

function selectPrompt(prompt: string) {
  localPrompt.value = prompt
  showPicker.value = false
}

async function deletePrompt(id: number) {
  await $fetch(`/api/prompts/${id}`, { method: 'DELETE' })
  emit('prompt-deleted', id)
}

// ── Save prompt ──
const showSaveForm = ref(false)
const savePromptName = ref('')
const saving = ref(false)

async function savePrompt() {
  if (!savePromptName.value.trim() || !localPrompt.value.trim()) return
  saving.value = true
  try {
    const saved = await $fetch<SavedPrompt>('/api/prompts', {
      method: 'POST',
      body: { name: savePromptName.value.trim(), prompt: localPrompt.value.trim(), projectId: props.projectId },
    })
    emit('prompt-saved', saved)
    savePromptName.value = ''
    showSaveForm.value = false
  } finally {
    saving.value = false
  }
}
</script>
