<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('update:show', false)"
  >
    <div class="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-800">AI Rewrite — {{ fieldName }}</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          @click="$emit('update:show', false)"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-4 px-5 py-4">
        <!-- Current value -->
        <div>
          <p class="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Current value</p>
          <div class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 break-words">
            {{ currentValue || '(empty)' }}
          </div>
        </div>

        <!-- Instruction -->
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">
            Instructions <span class="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            v-model="instruction"
            rows="2"
            placeholder="e.g. Make it more urgent, write for seniors, keep it under 10 words…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <!-- Generate button -->
        <button
          type="button"
          :disabled="loading"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          @click="generate"
        >
          {{ loading ? 'Generating…' : suggestion ? 'Regenerate' : 'Generate with AI' }}
        </button>

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <!-- Suggestion -->
        <div v-if="suggestion">
          <label class="mb-1 block text-sm font-medium text-slate-700">Suggestion</label>
          <textarea
            v-model="suggestion"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div class="mt-2 flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="accept"
            >
              Accept
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              @click="$emit('update:show', false)"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Footer: model info -->
      <div v-if="usedModel" class="border-t border-slate-100 px-5 py-2">
        <p class="text-xs text-slate-400">Model: {{ usedModel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  fieldName: string
  currentValue: string
  templateName: string
  otherFields: Array<{ name: string; value: string }>
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  accept: [value: string]
}>()

const instruction = ref('')
const suggestion = ref('')
const usedModel = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function generate() {
  error.value = null
  loading.value = true
  try {
    const allFields = [
      { name: props.fieldName, value: props.currentValue },
      ...props.otherFields,
    ]
    const res = await $fetch<{ suggestion: string; model: string }>('/api/ai/copy', {
      method: 'POST',
      body: {
        mode: 'single',
        templateName: props.templateName,
        fieldName: props.fieldName,
        currentValue: props.currentValue,
        instruction: instruction.value,
        fields: allFields,
      },
    })
    suggestion.value = res.suggestion
    usedModel.value = res.model
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Generation failed'
        : 'Generation failed'
  } finally {
    loading.value = false
  }
}

function accept() {
  emit('accept', suggestion.value)
  emit('update:show', false)
}
</script>
