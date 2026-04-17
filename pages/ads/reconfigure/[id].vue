<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-6">
      <NuxtLink :to="`/ads/${id}`" class="text-sm text-slate-500 hover:text-slate-700">← Back to Ad Profile</NuxtLink>
    </div>

    <div v-if="pending" class="text-slate-500">Loading…</div>

    <div v-else-if="!config || !template" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      Failed to load the ad profile or template.
    </div>

    <template v-else>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Updating Existing Ad Profile</p>
      <h1 class="mt-0.5 mb-1 text-2xl font-bold text-slate-900">Reconfigure Fields — {{ config.name }}</h1>
      <p class="mb-2 text-sm text-slate-600">
        The Templated.io template has been updated. Map your content to the new field layout below.
        Values from fields that still exist have been carried over automatically.
      </p>
      <div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong class="font-semibold">Tip:</strong> Each field has an <span class="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Included</span> / <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">Excluded</span> button in its header.
        Click it to toggle whether that field is part of this ad profile. Excluded fields are stored but won't be sent when generating an ad.
      </div>
      <p class="mb-8 text-xs text-slate-400">
        {{ template.width ?? '?' }} × {{ template.height ?? '?' }}px
        <span v-if="newLayers.length" class="ml-1">· {{ newLayers.length }} layers</span>
        <span v-if="removedLayers.length" class="ml-2 text-amber-600">
          · {{ removedLayers.length }} field{{ removedLayers.length !== 1 ? 's' : '' }} removed from template
        </span>
      </p>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <!-- Left: template preview -->
        <div class="xl:sticky xl:top-6 xl:self-start">
          <div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #f8fafc;">
            <img
              v-if="template.thumbnail"
              :src="template.thumbnail"
              :alt="config.name"
              style="display: block; width: 100%; height: auto; max-width: none;"
            />
            <div v-else class="flex h-48 items-center justify-center text-sm text-slate-400">No preview</div>
          </div>
          <p class="mt-2 text-center text-xs text-slate-400">Updated Templated.io Template</p>

          <!-- New template fields list -->
          <div class="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <p class="text-xs font-semibold text-slate-700">Fields in updated template:</p>
            <ul class="mt-2 space-y-1.5">
              <li
                v-for="layer in newLayers"
                :key="`${layer.layer}::${layer.type}`"
                class="flex items-center gap-2 text-xs"
              >
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide"
                  :class="layer.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ layer.type === 'image' ? 'Img' : 'Txt' }}
                </span>
                <span class="text-slate-800">{{ layer.layer }}</span>
                <span
                  v-if="!isCarriedOver(layer.layer, layer.type)"
                  class="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 font-semibold text-blue-700"
                >New</span>
                <span
                  v-else
                  class="ml-auto text-slate-400"
                >✓</span>
              </li>
            </ul>
          </div>

          <!-- Removed layers notice -->
          <div v-if="removedLayers.length" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p class="text-xs font-semibold text-amber-800">Fields no longer in this template:</p>
            <ul class="mt-2 space-y-0.5">
              <li v-for="l in removedLayers" :key="`${l.layer}::${l.type}`" class="text-xs text-amber-700 line-through">
                {{ l.layer }}
                <span v-if="oldLayersByName[l.layer]?.type !== undefined" class="not-italic opacity-60">({{ l.type }})</span>
              </li>
            </ul>
            <p class="mt-2 text-xs text-amber-600">These values will be discarded when you save.</p>
          </div>
        </div>

        <!-- Right: layer configuration -->
        <div class="space-y-4">
          <!-- Profile name -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label class="mb-1 block text-sm font-semibold text-slate-700">Ad Profile Name</label>
            <input
              v-model="profileName"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- One card per new template layer -->
          <div
            v-for="layer in newLayers"
            :key="layer.layer"
            class="rounded-xl border bg-white shadow-sm transition-opacity"
            :class="layerIncluded[layer.layer] !== false
              ? (isCarriedOver(layer.layer, layer.type) ? 'border-slate-200' : 'border-blue-200')
              : 'border-slate-100 opacity-60'"
          >
            <div class="flex items-center gap-2 px-5 py-3">
              <span
                class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                :class="layer.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ layer.type === 'image' ? 'Image' : 'Text' }}
              </span>
              <span class="font-medium text-slate-800">{{ layer.layer }}</span>
              <span v-if="layer.description" class="text-xs text-slate-400">· {{ layer.description }}</span>
              <span
                v-if="layerIncluded[layer.layer] !== false && !isCarriedOver(layer.layer, layer.type)"
                class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"
              >
                New
              </span>
              <span
                v-else-if="layerIncluded[layer.layer] !== false"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                Carried over
              </span>
              <button
                type="button"
                class="ml-auto rounded px-2 py-0.5 text-xs font-medium transition-colors"
                :class="layerIncluded[layer.layer] !== false
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'"
                @click="layerIncluded[layer.layer] = layerIncluded[layer.layer] === false"
              >
                {{ layerIncluded[layer.layer] !== false ? 'Included' : 'Excluded' }}
              </button>
            </div>

            <!-- Card body — hidden when excluded -->
            <template v-if="layerIncluded[layer.layer] !== false">
              <div class="border-t border-slate-100 px-5 pb-5 pt-4">
                <!-- Text layer -->
                <template v-if="layer.type !== 'image'">
                  <textarea
                    v-model="layerValues[layer.layer]"
                    rows="2"
                    :placeholder="`Enter text for '${layer.layer}'…`"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </template>

                <!-- Image layer -->
                <template v-else>
                  <ImageLayerInput
                    :layer-name="layer.layer"
                    :prompt="layerValues[layer.layer]"
                    :r2-key="layerR2Keys[layer.layer]"
                    :image-mode="layerModes[layer.layer]"
                    :saved-prompts="promptLibrary"
                    :profile-id="id"
                    :project-id="config?.projectId ?? undefined"
                    @update:prompt="layerValues[layer.layer] = $event"
                    @update:r2-key="layerR2Keys[layer.layer] = $event"
                    @update:image-mode="layerModes[layer.layer] = $event"
                    @prompt-saved="promptLibrary.unshift($event)"
                    @prompt-deleted="promptLibrary = promptLibrary.filter(p => p.id !== $event)"
                  />
                </template>
              </div>
            </template>
          </div>

          <!-- Error + submit -->
          <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

          <div class="pt-1">
            <button
              type="button"
              :disabled="saving || !profileName.trim()"
              class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
              @click="saveReconfigured"
            >
              {{ saving ? 'Saving…' : 'Save Updated Profile →' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'] })

interface LayerSelection {
  layer: string
  type: string
  value?: string
  prompt?: string
  r2Key?: string
  imageMode?: string
  included?: boolean
}

interface AdConfig {
  id: number
  projectId: number | null
  name: string
  templateId: string | null
  templateLayers: string | null
}

interface TemplatedLayer {
  layer: string
  type: string
  description?: string
  text?: string
}

interface TemplatedTemplate {
  id: string
  name: string
  thumbnail?: string
  width?: number
  height?: number
  layers?: TemplatedLayer[]
}

interface SavedPrompt {
  id: number
  name: string
  prompt: string
}

const route = useRoute()
const id = Number(route.params.id)

const { data, pending } = await useAsyncData(`reconfigure-${id}`, async () => {
  const res = await $fetch<{ config: AdConfig }>(`/api/ad-configs/${id}`)
  if (!res.config.templateId) return { config: res.config, template: null as TemplatedTemplate | null }
  const template = await $fetch<TemplatedTemplate>(`/api/templated/templates/${res.config.templateId}`)
  return { config: res.config, template }
})

const [promptsRes] = await Promise.all([
  useFetch<SavedPrompt[]>('/api/prompts', { server: false }),
])
const promptLibrary = ref<SavedPrompt[]>(promptsRes.data.value ?? [])

const config = computed(() => data.value?.config ?? null)
const template = computed(() => data.value?.template ?? null)
const newLayers = computed(() => (template.value?.layers ?? []).filter(l => l.type === 'text' || l.type === 'image'))

const oldLayersByName = computed<Record<string, LayerSelection>>(() => {
  if (!config.value?.templateLayers) return {}
  try {
    const layers: LayerSelection[] = JSON.parse(config.value.templateLayers)
    return Object.fromEntries(layers.map(l => [l.layer, l]))
  } catch {
    return {}
  }
})

// A layer is "carried over" only when both name AND type match the old stored layer.
// If the type changed (even with the same name), it's treated as a new field.
const newLayerKeys = computed(() => new Set(newLayers.value.map(l => `${l.layer}::${l.type}`)))

const removedLayers = computed(() =>
  Object.values(oldLayersByName.value).filter(l => !newLayerKeys.value.has(`${l.layer}::${l.type}`))
)

function isCarriedOver(layerName: string, layerType: string): boolean {
  return newLayerKeys.value.has(`${layerName}::${layerType}`) && layerName in oldLayersByName.value
}

// Per-layer form state — pre-populated only when name AND type match
const layerValues = reactive<Record<string, string>>({})
const layerR2Keys = reactive<Record<string, string>>({})
const layerModes = reactive<Record<string, 'generate' | 'upload'>>({})
const layerIncluded = reactive<Record<string, boolean>>({})

watch(newLayers, (layers) => {
  for (const layer of layers) {
    const old = oldLayersByName.value[layer.layer]
    const typeMatches = old?.type === layer.type
    if (layer.type !== 'image') {
      layerValues[layer.layer] = (old && typeMatches) ? (old.value ?? '') : (layer.text ?? '')
    } else {
      layerValues[layer.layer] = (old && typeMatches) ? (old.prompt ?? '') : ''
      layerR2Keys[layer.layer] = (old && typeMatches) ? (old.r2Key ?? '') : ''
      layerModes[layer.layer] = (old && typeMatches) ? ((old.imageMode as 'generate' | 'upload') ?? 'generate') : 'generate'
    }
    // Carry over included flag; new layers default to true
    layerIncluded[layer.layer] = (old && typeMatches) ? (old.included !== false) : true
  }
}, { immediate: true })

const profileName = ref(config.value?.name ?? '')

const saving = ref(false)
const saveError = ref<string | null>(null)

async function saveReconfigured() {
  saveError.value = null
  saving.value = true
  try {
    const templateLayers = newLayers.value.map(l => {
      const included = layerIncluded[l.layer] !== false
      if (l.type !== 'image') {
        return { layer: l.layer, type: l.type, value: layerValues[l.layer]?.trim() ?? '', included }
      }
      return {
        layer: l.layer,
        type: l.type,
        imageMode: layerModes[l.layer],
        included,
        ...(layerModes[l.layer] === 'upload'
          ? { r2Key: layerR2Keys[l.layer] }
          : { prompt: layerValues[l.layer]?.trim() ?? '' }),
      }
    })

    await $fetch(`/api/ad-configs/${id}`, {
      method: 'PUT',
      body: { name: profileName.value.trim(), templateLayers },
    })

    clearNuxtData(`ad-config-${id}`)
    await navigateTo(`/ads/${id}`)
  } catch (e: unknown) {
    saveError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to save'
        : 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
