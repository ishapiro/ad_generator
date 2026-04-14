<template>
  <div class="space-y-2">
    <div
      v-for="(step, index) in modelValue"
      :key="index"
      class="flex items-center gap-2"
    >
      <span class="w-5 shrink-0 text-sm text-slate-400 text-right">{{ index + 1 }}.</span>
      <input
        type="text"
        :value="step.icon"
        placeholder="icon (e.g. lightbulb)"
        class="w-40 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @input="updateStep(index, 'icon', ($event.target as HTMLInputElement).value)"
      />
      <input
        type="text"
        :value="step.label"
        placeholder="label (e.g. Idea)"
        class="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @input="updateStep(index, 'label', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="shrink-0 rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50 hover:text-red-700"
        @click="removeStep(index)"
      >
        Remove
      </button>
    </div>
    <button
      type="button"
      class="mt-1 rounded border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600"
      @click="addStep"
    >
      + Add Step
    </button>
  </div>
</template>

<script setup lang="ts">
interface BulletStep {
  icon: string
  label: string
}

const props = defineProps<{ modelValue: BulletStep[] }>()
const emit = defineEmits<{ 'update:modelValue': [BulletStep[]] }>()

function updateStep(index: number, field: 'icon' | 'label', value: string) {
  const updated = props.modelValue.map((s, i) =>
    i === index ? { ...s, [field]: value } : s,
  )
  emit('update:modelValue', updated)
}

function removeStep(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function addStep() {
  emit('update:modelValue', [...props.modelValue, { icon: '', label: '' }])
}
</script>
