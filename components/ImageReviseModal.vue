<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  r2Key: string
  projectId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  revised: [{ r2Key: string; url: string }]
}>()

const provider = ref<'gemini' | 'fal'>('gemini')
const instructions = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const revisedR2Key = ref<string | null>(null)
const revisedUrl = ref<string | null>(null)

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

function reset() {
  instructions.value = ''
  error.value = null
  revisedR2Key.value = null
  revisedUrl.value = null
  submitting.value = false
}

watch(() => props.modelValue, (open) => {
  if (open) reset()
})

async function revise() {
  error.value = null
  submitting.value = true
  try {
    const res = await $fetch<{ r2Key: string; url: string }>('/api/ai/revise-image', {
      method: 'POST',
      body: {
        r2Key: props.r2Key,
        instructions: instructions.value.trim(),
        provider: provider.value,
        projectId: props.projectId,
      },
    })
    revisedR2Key.value = res.r2Key
    revisedUrl.value = res.url
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Revision failed'
        : 'Revision failed'
  } finally {
    submitting.value = false
  }
}

function done() {
  if (revisedR2Key.value && revisedUrl.value) {
    emit('revised', { r2Key: revisedR2Key.value, url: revisedUrl.value })
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
        <h2 class="text-lg font-semibold text-slate-800">Revise Image</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
              @click="provider = 'fal'"
            >
              Fal.ai
            </button>
          </div>
        </div>

        <!-- Current image -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Current Image</label>
          <div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
            <img
              :src="`/api/images/${r2Key}`"
              alt="Image to revise"
              style="display: block; width: 100%; height: auto; max-width: none;"
            />
          </div>
        </div>

        <!-- Instructions -->
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-slate-700">
            Describe what to change
          </label>
          <textarea
            v-model="instructions"
            rows="3"
            placeholder="e.g. Make the background darker, add more contrast, change the color scheme to blue…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :disabled="submitting"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <!-- Revised image preview -->
        <div v-if="revisedUrl">
          <label class="mb-2 block text-sm font-semibold text-slate-700">Revised Image</label>
          <div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
            <img
              :src="revisedUrl"
              alt="Revised image"
              style="display: block; width: 100%; height: auto; max-width: none;"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          :disabled="submitting"
          @click="close"
        >
          Cancel
        </button>
        <button
          v-if="!revisedUrl"
          type="button"
          :disabled="submitting || !instructions.trim()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          @click="revise"
        >
          {{ submitting ? 'Revising…' : 'Revise' }}
        </button>
        <button
          v-else
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
