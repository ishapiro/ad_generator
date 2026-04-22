<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  projectId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [{ r2Key: string; url: string }]
}>()

const provider = ref<'gemini' | 'fal'>('gemini')
const prompt = ref('')
const generating = ref(false)
const revising = ref(false)
const error = ref<string | null>(null)
const currentR2Key = ref<string | null>(null)
const currentUrl = ref<string | null>(null)
const reviseInstructions = ref('')

const busy = computed(() => generating.value || revising.value)

function close() {
  if (busy.value) return
  emit('update:modelValue', false)
}

function reset() {
  prompt.value = ''
  error.value = null
  currentR2Key.value = null
  currentUrl.value = null
  reviseInstructions.value = ''
  generating.value = false
  revising.value = false
}

watch(() => props.modelValue, (open) => {
  if (open) reset()
})

async function generate() {
  error.value = null
  generating.value = true
  try {
    const res = await $fetch<{ r2Key: string; url: string }>('/api/ai/generate-image', {
      method: 'POST',
      body: {
        prompt: prompt.value.trim(),
        provider: provider.value,
        projectId: props.projectId,
      },
    })
    currentR2Key.value = res.r2Key
    currentUrl.value = res.url
    reviseInstructions.value = ''
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Generation failed'
        : 'Generation failed'
  } finally {
    generating.value = false
  }
}

async function applyRevision() {
  if (!currentR2Key.value || !reviseInstructions.value.trim()) return
  error.value = null
  revising.value = true
  try {
    const res = await $fetch<{ r2Key: string; url: string }>('/api/ai/revise-image', {
      method: 'POST',
      body: {
        r2Key: currentR2Key.value,
        instructions: reviseInstructions.value.trim(),
        provider: provider.value,
        projectId: props.projectId,
      },
    })
    currentR2Key.value = res.r2Key
    currentUrl.value = res.url
    reviseInstructions.value = ''
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Revision failed'
        : 'Revision failed'
  } finally {
    revising.value = false
  }
}

function regenerate() {
  currentR2Key.value = null
  currentUrl.value = null
  reviseInstructions.value = ''
  error.value = null
}

function done() {
  if (currentR2Key.value && currentUrl.value) {
    emit('saved', { r2Key: currentR2Key.value, url: currentUrl.value })
  }
  emit('update:modelValue', false)
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
    @click.self="close"
  >
    <div class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">

      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">Generate Image</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          :disabled="busy"
          @click="close"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="overflow-y-auto p-6 space-y-5">

        <!-- Provider toggle -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">AI Provider</label>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              :class="provider === 'gemini'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              :disabled="busy"
              @click="provider = 'gemini'"
            >
              Gemini
            </button>
            <button
              type="button"
              class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              :class="provider === 'fal'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              :disabled="busy"
              @click="provider = 'fal'"
            >
              Fal.ai
            </button>
          </div>
        </div>

        <!-- Prompt -->
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-slate-700">Prompt</label>
          <textarea
            v-model="prompt"
            rows="3"
            placeholder="Describe the image you want to generate…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :disabled="busy"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <!-- Result preview -->
        <div v-if="currentUrl">
          <label class="mb-2 block text-sm font-semibold text-slate-700">Generated Image</label>
          <div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
            <img
              :src="currentUrl"
              alt="Generated image"
              style="display: block; width: 100%; height: auto; max-width: none;"
            />
          </div>
        </div>

        <!-- Revision section (only shown after first generation) -->
        <div v-if="currentUrl">
          <label class="mb-1.5 block text-sm font-semibold text-slate-700">Revise</label>
          <textarea
            v-model="reviseInstructions"
            rows="2"
            placeholder="Describe what to change in the image above…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :disabled="busy"
          />
        </div>

      </div>

      <!-- Footer -->
      <div class="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
        <!-- Left: Regenerate (after first generation) -->
        <button
          v-if="currentUrl"
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          :disabled="busy"
          @click="regenerate"
        >
          Regenerate
        </button>

        <div class="flex-1" />

        <!-- Right: Cancel / primary action -->
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          :disabled="busy"
          @click="close"
        >
          Cancel
        </button>

        <!-- Revise button (shown when there's a result AND revision text) -->
        <button
          v-if="currentUrl && reviseInstructions.trim()"
          type="button"
          :disabled="busy"
          class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          @click="applyRevision"
        >
          {{ revising ? 'Revising…' : 'Revise' }}
        </button>

        <!-- Generate / Save button -->
        <button
          v-if="!currentUrl"
          type="button"
          :disabled="busy || !prompt.trim()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          @click="generate"
        >
          {{ generating ? 'Generating…' : 'Generate' }}
        </button>
        <button
          v-else-if="!reviseInstructions.trim()"
          type="button"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          @click="done"
        >
          Done — Save to Library
        </button>
      </div>

    </div>
  </div>
</template>
