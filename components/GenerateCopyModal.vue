<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('update:show', false)"
  >
    <div class="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-800">Generate All Copy with AI</h2>
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
        <!-- Brief textarea -->
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">
            Copy Brief
            <span class="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            v-model="brief"
            rows="4"
            placeholder="Describe your product, audience, tone, and key message. e.g. A summer sale for outdoor furniture targeting homeowners aged 35–55. Friendly but professional tone. Emphasize 40% off and free delivery."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <!-- Saved briefs toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Picker -->
          <div class="relative">
            <div v-if="showPicker" class="fixed inset-0 z-10" @click="showPicker = false" />
            <button
              type="button"
              class="relative z-20 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              @click="showPicker = !showPicker"
            >
              Saved Briefs
              <span v-if="savedBriefs.length" class="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
                {{ savedBriefs.length }}
              </span>
            </button>

            <div
              v-if="showPicker"
              class="absolute left-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div class="max-h-60 overflow-y-auto">
                <div v-if="!savedBriefs.length" class="px-4 py-6 text-center text-sm text-slate-400">
                  No saved briefs yet.
                </div>
                <div
                  v-for="b in savedBriefs"
                  :key="b.id"
                  class="group flex items-start gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0"
                >
                  <button type="button" class="flex-1 text-left" @click="selectBrief(b.brief)">
                    <p class="text-sm font-medium text-slate-800 group-hover:text-blue-600">{{ b.name }}</p>
                    <p class="mt-0.5 line-clamp-2 text-xs text-slate-400">{{ b.brief }}</p>
                  </button>
                  <button
                    type="button"
                    class="mt-0.5 shrink-0 text-slate-300 hover:text-red-500"
                    title="Delete brief"
                    @click.stop="deleteBrief(b.id)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Save current brief -->
          <template v-if="!showSaveForm">
            <button
              type="button"
              :disabled="!brief.trim()"
              class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              @click="showSaveForm = true"
            >
              Save Brief
            </button>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <input
                v-model="saveBriefName"
                type="text"
                placeholder="Brief name…"
                autofocus
                class="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @keydown.enter.prevent="saveBrief"
                @keydown.escape="showSaveForm = false"
              />
              <button
                type="button"
                :disabled="saving || !saveBriefName.trim()"
                class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                @click="saveBrief"
              >
                {{ saving ? '…' : 'Save' }}
              </button>
              <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="showSaveForm = false">
                Cancel
              </button>
            </div>
          </template>
        </div>

        <!-- Fields — check to include, uncheck to exclude -->
        <div class="rounded-lg bg-slate-50 px-3 py-2">
          <p class="mb-1.5 text-xs font-medium text-slate-500">Text fields that will be filled</p>
          <ul class="space-y-1">
            <li v-for="f in textFields" :key="f.name" class="flex items-baseline gap-2">
              <input
                :id="`field-${f.name}`"
                type="checkbox"
                :checked="!excludedFields.has(f.name)"
                class="mt-0.5 shrink-0 accent-blue-600"
                @change="toggleField(f.name)"
              />
              <label
                :for="`field-${f.name}`"
                class="cursor-pointer text-xs text-slate-600"
                :class="excludedFields.has(f.name) ? 'line-through text-slate-400' : ''"
              >
                <span class="font-medium">{{ f.name }}</span>
                <span v-if="f.value" class="ml-1 text-slate-400">· "{{ f.value.slice(0, 40) }}{{ f.value.length > 40 ? '…' : '' }}"</span>
              </label>
            </li>
          </ul>
          <p class="mt-2 text-xs text-slate-400">
            Image fields are skipped here. To update image prompts with AI, use the AI button next to each image field individually.
          </p>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            :disabled="loading || excludedFields.size >= textFields.length"
            class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            @click="generate"
          >
            {{ loading ? 'Generating…' : 'Generate' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            @click="$emit('update:show', false)"
          >
            Cancel
          </button>
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
interface SavedBrief {
  id: number
  name: string
  brief: string
}

const props = defineProps<{
  show: boolean
  templateName: string
  fields: Array<{ name: string; value: string; type?: string }>
  projectId?: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  generated: [payload: { suggestions: Array<{ name: string; value: string }>; model: string }]
}>()

// Exclude image layers — only generate text copy
const textFields = computed(() => props.fields.filter(f => f.type !== 'image'))

// Fields the user has unchecked — start empty (all included by default)
const excludedFields = ref(new Set<string>())

function toggleField(name: string) {
  if (excludedFields.value.has(name)) {
    excludedFields.value.delete(name)
  } else {
    excludedFields.value.add(name)
  }
  // Trigger reactivity on the Set
  excludedFields.value = new Set(excludedFields.value)
}

const brief = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const usedModel = ref('')

// ── Saved briefs ──
const savedBriefs = ref<SavedBrief[]>([])
const showPicker = ref(false)

onMounted(async () => {
  try {
    savedBriefs.value = await $fetch<SavedBrief[]>('/api/briefs')
  } catch {
    // non-fatal
  }
})

function selectBrief(text: string) {
  brief.value = text
  showPicker.value = false
}

async function deleteBrief(id: number) {
  await $fetch(`/api/briefs/${id}`, { method: 'DELETE' })
  savedBriefs.value = savedBriefs.value.filter(b => b.id !== id)
}

// ── Save brief ──
const showSaveForm = ref(false)
const saveBriefName = ref('')
const saving = ref(false)

async function saveBrief() {
  if (!saveBriefName.value.trim() || !brief.value.trim()) return
  saving.value = true
  try {
    const saved = await $fetch<SavedBrief>('/api/briefs', {
      method: 'POST',
      body: { name: saveBriefName.value.trim(), brief: brief.value.trim(), projectId: props.projectId },
    })
    savedBriefs.value.unshift(saved)
    saveBriefName.value = ''
    showSaveForm.value = false
  } finally {
    saving.value = false
  }
}

// ── Generate ──
async function generate() {
  error.value = null
  usedModel.value = ''
  loading.value = true
  try {
    const includedFields = textFields.value.filter(f => !excludedFields.value.has(f.name))
    const res = await $fetch<{ suggestions: Array<{ name: string; value: string }>; model: string }>('/api/ai/copy', {
      method: 'POST',
      body: {
        mode: 'all',
        templateName: props.templateName,
        brief: brief.value,
        fields: includedFields,
      },
    })
    usedModel.value = res.model
    emit('generated', res)
    emit('update:show', false)
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Generation failed'
        : 'Generation failed'
  } finally {
    loading.value = false
  }
}
</script>
