<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-700">← Back</NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">New Ad Config</h1>
    </div>

    <form class="space-y-6" @submit.prevent="save">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Left column: text fields -->
        <div class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">Ad Content</h2>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Config Name</label>
            <input v-model="form.name" type="text" placeholder="My Ad Config" required class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Headline</label>
            <input v-model="form.headline" type="text" placeholder="From Idea to Company." class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Subheadline</label>
            <input v-model="form.subheadline" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Body Copy</label>
            <textarea v-model="form.bodyText" rows="3" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">CTA Button Text</label>
            <input v-model="form.ctaText" type="text" placeholder="Try It Free" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Background Color / Description</label>
            <input v-model="form.backgroundDescription" type="text" placeholder="dark navy" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Hero Image Prompt</label>
            <textarea v-model="form.heroImagePrompt" rows="4" class="input-field" />
          </div>
        </div>

        <!-- Right column: bullet steps -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Bullet Steps</h2>
          <BulletStepEditor v-model="form.bulletSteps" />
        </div>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="rounded bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <NuxtLink to="/" class="rounded border border-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-50">
          Cancel
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const saving = ref(false)

const form = reactive({
  name: '',
  headline: 'From Idea to Company.',
  subheadline: 'Playbooks to build. AI to move fast. A system to scale.',
  bodyText: 'Learn how to go from idea to prototype to funded company. Then build the playbooks that train every person who joins you.',
  ctaText: 'Try It Free',
  backgroundDescription: 'dark navy',
  heroImagePrompt:
    "Professional tech-office setting. A focused founder sits at a minimalist light-wood desk with a MacBook. Behind him is a large glass whiteboard with the word 'IDEA' written in blue marker. High-key lighting, soft architectural shadows, clean 8k photography, minimalist aesthetic. Plenty of negative space on the left side of the frame.",
  bulletSteps: [
    { icon: 'lightbulb',        label: 'Idea'      },
    { icon: 'graduation cap',   label: 'Learn'     },
    { icon: 'stacked layers',   label: 'Build'     },
    { icon: 'monitor screen',   label: 'Prototype' },
    { icon: 'group of people',  label: 'Hire'      },
    { icon: 'bar chart',        label: 'Scale'     },
  ] as Array<{ icon: string; label: string }>,
})

async function save() {
  saving.value = true
  try {
    const created = await $fetch<{ id: number }>('/api/ad-configs', {
      method: 'POST',
      body: form,
    })
    navigateTo(`/ads/${created.id}`)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to save'
    alert(message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
</style>
