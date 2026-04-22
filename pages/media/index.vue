<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <!-- Header -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <NuxtLink v-if="projectId" :to="`/ads?projectId=${projectId}`" class="text-sm text-slate-500 hover:text-slate-700">← Ad Profiles</NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900" :class="projectId ? 'mt-1' : ''">Media Library</h1>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="activeFolder !== 'generated'"
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="showFolderModal = true"
        >
          Manage Folders
        </button>
        <label
          v-if="activeFolder !== 'generated'"
          class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          :class="uploading ? 'pointer-events-none opacity-60' : ''"
        >
          {{ uploading ? 'Uploading…' : '+ Upload' }}
          <input type="file" accept="image/png,image/gif,image/jpeg,image/svg+xml" class="hidden" :disabled="uploading" @change="handleUpload" />
        </label>
      </div>
    </div>

    <p v-if="uploadError" class="mb-4 text-sm text-red-600">{{ uploadError }}</p>

    <div class="flex gap-6">
      <!-- Folder sidebar -->
      <aside class="hidden w-48 shrink-0 lg:block">
        <nav class="space-y-1">
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition"
            :class="activeFolder === null ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'"
            @click="activeFolder = null; selectedIds.clear()"
          >
            All <span class="ml-1 text-xs text-slate-400">({{ items.length }})</span>
          </button>
          <button
            v-for="folder in folders"
            :key="folder.id"
            type="button"
            class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition"
            :class="activeFolder === folder.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'"
            @click="activeFolder = folder.id; selectedIds.clear()"
          >
            {{ folder.name }}
            <span class="ml-1 text-xs text-slate-400">({{ folder.imageCount }})</span>
          </button>
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition"
            :class="activeFolder === 'none' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'"
            @click="activeFolder = 'none'; selectedIds.clear()"
          >
            Unorganized
            <span class="ml-1 text-xs text-slate-400">({{ unorganizedCount }})</span>
          </button>

          <div class="my-2 border-t border-slate-200" />

          <!-- Virtual folder -->
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition"
            :class="activeFolder === 'generated' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-100'"
            @click="activeFolder = 'generated'; selectedIds.clear()"
          >
            Generated Ads
            <span class="ml-1 text-xs text-slate-400">({{ generatedAds.length }})</span>
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <div class="min-w-0 flex-1">
        <!-- Mobile folder pills -->
        <div class="mb-4 flex flex-wrap gap-2 lg:hidden">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="activeFolder === null ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
            @click="activeFolder = null; selectedIds.clear()"
          >All</button>
          <button
            v-for="folder in folders"
            :key="folder.id"
            type="button"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="activeFolder === folder.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
            @click="activeFolder = folder.id; selectedIds.clear()"
          >{{ folder.name }}</button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="activeFolder === 'none' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
            @click="activeFolder = 'none'; selectedIds.clear()"
          >Unorganized</button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="activeFolder === 'generated' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'"
            @click="activeFolder = 'generated'; selectedIds.clear()"
          >Generated Ads</button>
        </div>

        <!-- Search (not shown for generated ads view) -->
        <div v-if="activeFolder !== 'generated'" class="mb-4">
          <input
            v-model="search"
            type="search"
            placeholder="Search by filename or keyword…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-sm"
          />
        </div>

        <!-- ══ GENERATED ADS VIEW ══ -->
        <template v-if="activeFolder === 'generated'">
          <p class="mb-4 text-sm text-slate-500">
            Completed ad generations. Download, copy a link, or save a copy to the library to reuse as an uploaded asset.
          </p>
          <div v-if="generatedAdsPending" class="py-20 text-center text-slate-400">Loading…</div>
          <div v-else-if="generatedAds.length === 0" class="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
            <p class="text-slate-400">No generated ads yet.</p>
            <NuxtLink to="/ads" class="mt-2 inline-block text-sm text-blue-600 hover:underline">Go generate one →</NuxtLink>
          </div>
          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <div
              v-for="ad in generatedAds"
              :key="ad.id"
              class="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm"
            >
              <!-- Thumbnail -->
              <a :href="`/api/images/${ad.r2Key}`" target="_blank">
                <img
                  :src="`/api/images/${ad.r2Key}`"
                  :alt="`Generated ad for ${ad.profileName}`"
                  class="aspect-square w-full object-cover"
                />
              </a>

              <!-- Info -->
              <div class="p-2">
                <p class="truncate text-xs font-medium text-slate-800" :title="ad.profileName">{{ ad.profileName }}</p>
                <p class="text-xs text-slate-400">{{ new Date(ad.createdAt ?? '').toLocaleDateString() }}</p>

                <!-- Profile link -->
                <NuxtLink
                  :to="`/ads/${ad.adConfigId}`"
                  class="mt-1 inline-block text-xs text-blue-500 hover:underline"
                >
                  View profile →
                </NuxtLink>

                <!-- Actions -->
                <div class="mt-2 flex items-center justify-between gap-1">
                  <!-- Download -->
                  <a
                    :href="`/api/images/${ad.r2Key}?download=1`"
                    download
                    title="Download"
                    class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </a>

                  <!-- Copy link -->
                  <button
                    type="button"
                    title="Copy link"
                    class="rounded p-1 transition"
                    :class="copiedId === `gen-${ad.id}` ? 'text-emerald-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'"
                    @click="copyGeneratedLink(ad)"
                  >
                    <svg v-if="copiedId !== `gen-${ad.id}`" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>

                  <!-- Save to Library -->
                  <button
                    type="button"
                    title="Save a copy to Media Library"
                    :disabled="savingToLibraryId === ad.id"
                    class="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                    @click="saveToLibrary(ad)"
                  >
                    <svg v-if="savingToLibraryId !== ad.id" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </button>

                  <!-- Revise -->
                  <button
                    type="button"
                    title="Revise with AI"
                    class="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    @click="openRevise(ad.r2Key)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    title="Delete generated ad"
                    class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    @click="deleteGeneratedAd(ad)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p v-if="saveToLibraryError[ad.id]" class="mt-1 text-xs text-red-600">{{ saveToLibraryError[ad.id] }}</p>
                <p v-if="savedToLibraryId === ad.id" class="mt-1 text-xs text-emerald-600">Saved to library!</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ══ UPLOADED MEDIA VIEW ══ -->
        <template v-else>
          <!-- Loading / empty -->
          <div v-if="pending" class="py-20 text-center text-slate-400">Loading…</div>
          <div v-else-if="filteredItems.length === 0" class="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
            <p class="text-slate-400">No media found.</p>
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition"
              :class="selectedIds.has(item.id) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200'"
            >
              <!-- Checkbox -->
              <div
                class="absolute left-2 top-2 z-10 transition"
                :class="selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
              >
                <input
                  type="checkbox"
                  :checked="selectedIds.has(item.id)"
                  class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                  @change="toggleSelect(item.id)"
                />
              </div>

              <!-- Lock badge -->
              <div
                v-if="item.locked || item.usedInProfiles.length > 0"
                class="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-xs shadow"
                :title="item.locked ? 'Locked by user' : `In use by ${item.usedInProfiles.length} profile(s)`"
              >
                🔒
              </div>

              <!-- Thumbnail -->
              <div
                class="cursor-pointer"
                style="background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px"
                @click="openEdit(item)"
              >
                <img
                  :src="`/api/images/${item.r2Key}`"
                  :alt="item.altText || item.filename"
                  class="aspect-square w-full object-cover"
                />
              </div>

              <!-- Info -->
              <div class="p-2">
                <p class="truncate text-xs font-medium text-slate-800" :title="item.filename">{{ item.filename }}</p>

                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-if="item.folderName"
                    class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                  >{{ item.folderName }}</span>
                  <span
                    v-if="item.usedInProfiles.length > 0"
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
                  >{{ item.usedInProfiles.length }} ad{{ item.usedInProfiles.length === 1 ? '' : 's' }}</span>
                </div>

                <div v-if="item.keywords.length > 0" class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="kw in item.keywords.slice(0, 3)"
                    :key="kw"
                    class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                  >{{ kw }}</span>
                  <span v-if="item.keywords.length > 3" class="text-xs text-slate-400">+{{ item.keywords.length - 3 }}</span>
                </div>

                <!-- Actions -->
                <div class="mt-2 flex items-center justify-between gap-1">
                  <button type="button" title="Edit metadata" class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" @click="openEdit(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <a
                    :href="`/api/images/${item.r2Key}?download=1`"
                    download
                    title="Download"
                    class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    title="Copy link"
                    class="rounded p-1 transition"
                    :class="copiedId === `upload-${item.id}` ? 'text-emerald-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'"
                    @click="copyLink(item)"
                  >
                    <svg v-if="copiedId !== `upload-${item.id}`" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Revise with AI"
                    class="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    @click="openRevise(item.r2Key)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    :disabled="item.locked || item.usedInProfiles.length > 0"
                    class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    @click="deleteSingle(item)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- ── Selection toolbar (uploaded media only) ── -->
  <Transition enter-from-class="translate-y-full opacity-0" enter-active-class="transition duration-200" leave-to-class="translate-y-full opacity-0" leave-active-class="transition duration-200">
    <div
      v-if="selectedIds.size > 0 && activeFolder !== 'generated'"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white shadow-lg"
    >
      <div class="mx-auto flex max-w-wide items-center gap-4 px-4 py-3">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            :checked="selectedIds.size === filteredItems.length"
            :indeterminate="selectedIds.size > 0 && selectedIds.size < filteredItems.length"
            class="h-4 w-4 rounded border-slate-300 accent-blue-600"
            @change="toggleSelectAll"
          />
          {{ selectedIds.size }} selected
        </label>

        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="showMoveDropdown = !showMoveDropdown"
          >
            Move to Folder
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div v-if="showMoveDropdown" class="fixed inset-0 z-40" @click="showMoveDropdown = false" />
          <div v-if="showMoveDropdown" class="absolute bottom-full left-0 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button type="button" class="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50" @click="bulkMove(null)">
              Unorganized
            </button>
            <button
              v-for="folder in folders"
              :key="folder.id"
              type="button"
              class="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              @click="bulkMove(folder.id)"
            >
              {{ folder.name }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          @click="bulkDelete"
        >
          Delete
        </button>

        <button
          type="button"
          class="ml-auto text-sm text-slate-500 hover:text-slate-700"
          @click="selectedIds.clear()"
        >
          Clear
        </button>
      </div>
    </div>
  </Transition>

  <!-- ── Edit metadata modal ── -->
  <div
    v-if="editItem"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="editItem = null"
  >
    <div class="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">Edit Media</h2>
        <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" @click="editItem = null">✕</button>
      </div>

      <div class="overflow-y-auto">
        <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div>
            <div style="background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px; border-radius: 0.5rem; overflow: hidden;">
              <img
                :src="`/api/images/${editItem.r2Key}`"
                :alt="editItem.altText || editItem.filename"
                style="display: block; width: 100%; height: auto; max-width: none;"
              />
            </div>
            <p class="mt-2 break-all text-xs text-slate-400">{{ editItem.filename }}</p>
            <p v-if="editItem.usedInProfiles.length > 0" class="mt-3 text-sm font-medium text-slate-700">Used in profiles:</p>
            <ul v-if="editItem.usedInProfiles.length > 0" class="mt-1 space-y-1">
              <li v-for="p in editItem.usedInProfiles" :key="p.id">
                <NuxtLink :to="`/ads/${p.id}`" class="text-sm text-blue-600 hover:underline" @click="editItem = null">{{ p.name }}</NuxtLink>
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-slate-400">Not used in any profiles</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Folder</label>
              <select v-model="editForm.folderId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option :value="null">— Unorganized —</option>
                <option v-for="folder in folders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea v-model="editForm.description" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Keywords</label>
              <div class="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <span v-for="kw in editForm.keywords" :key="kw" class="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {{ kw }}
                  <button type="button" class="text-blue-400 hover:text-blue-700" @click="removeKeyword(kw)">×</button>
                </span>
                <input
                  v-model="keywordInput"
                  type="text"
                  placeholder="Add keyword…"
                  class="min-w-[100px] flex-1 text-sm outline-none"
                  @keydown.enter.prevent="addKeyword"
                  @keydown.comma.prevent="addKeyword"
                  @blur="addKeyword"
                />
              </div>
              <p class="mt-0.5 text-xs text-slate-400">Press Enter or comma to add</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Alt Text</label>
              <input v-model="editForm.altText" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Source</label>
              <input v-model="editForm.source" type="text" placeholder="Photographer, website URL…" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Copyright</label>
              <input v-model="editForm.copyright" type="text" placeholder="© 2026 Cogitations" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <label class="flex cursor-pointer items-center gap-3">
              <input v-model="editForm.locked" type="checkbox" class="h-4 w-4 rounded border-slate-300 accent-blue-600" />
              <span class="text-sm font-medium text-slate-700">🔒 Lock to prevent deletion</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <p v-if="editError" class="mr-auto text-sm text-red-600">{{ editError }}</p>
        <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="editItem = null">Cancel</button>
        <button
          type="button"
          :disabled="editSaving"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          @click="saveEdit"
        >
          {{ editSaving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ── Image Revise Modal ── -->
  <ImageReviseModal
    v-model="showReviseModal"
    :r2-key="reviseR2Key ?? ''"
    :project-id="projectId ?? undefined"
    @revised="onRevised"
  />

  <!-- ── Folder management modal ── -->
  <div
    v-if="showFolderModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="showFolderModal = false"
  >
    <div class="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">Manage Folders</h2>
        <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" @click="showFolderModal = false">✕</button>
      </div>
      <div class="p-4">
        <ul class="mb-4 space-y-2">
          <li v-if="folders.length === 0" class="text-center text-sm text-slate-400">No folders yet.</li>
          <li v-for="folder in folders" :key="folder.id" class="flex items-center gap-2">
            <input
              v-if="renamingFolderId === folder.id"
              v-model="renameValue"
              type="text"
              autofocus
              class="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              @keydown.enter.prevent="commitRename(folder.id)"
              @keydown.escape="renamingFolderId = null"
              @blur="commitRename(folder.id)"
            />
            <span v-else class="flex-1 text-sm text-slate-700">
              {{ folder.name }} <span class="text-xs text-slate-400">({{ folder.imageCount }})</span>
            </span>
            <button v-if="renamingFolderId !== folder.id" type="button" class="text-xs text-slate-400 hover:text-slate-700" @click="startRename(folder)">Rename</button>
            <button
              type="button"
              class="text-xs"
              :class="folder.imageCount > 0 ? 'cursor-not-allowed text-slate-300' : 'text-red-400 hover:text-red-600'"
              :disabled="folder.imageCount > 0"
              :title="folder.imageCount > 0 ? `Move ${folder.imageCount} image(s) out before deleting` : 'Delete folder'"
              @click="deleteFolder(folder.id)"
            >Delete</button>
          </li>
        </ul>
        <p v-if="folderError" class="mb-2 text-sm text-red-600">{{ folderError }}</p>
        <div class="flex gap-2">
          <input
            v-model="newFolderName"
            type="text"
            placeholder="New folder name…"
            class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @keydown.enter.prevent="createFolder"
          />
          <button type="button" :disabled="!newFolderName.trim()" class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" @click="createFolder">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], key: 'media-index' })

const route = useRoute()
const projectId = computed(() => route.query.projectId ? Number(route.query.projectId) : null)

interface MediaItem {
  id: number
  r2Key: string
  filename: string
  mimeType: string
  description: string | null
  keywords: string[]
  altText: string | null
  source: string | null
  copyright: string | null
  folderId: number | null
  folderName: string | null
  locked: boolean
  usedInProfiles: Array<{ id: number; name: string }>
  createdAt: Date | null
}

interface Folder {
  id: number
  name: string
  imageCount: number
}

interface GeneratedAdItem {
  id: number
  r2Key: string
  createdAt: Date | null
  adConfigId: number
  profileName: string
}

// ── Data ──
const { data, pending, refresh } = await useFetch<MediaItem[]>('/api/media', { key: 'media-index', server: false })
const { data: foldersData, refresh: refreshFolders } = await useFetch<Folder[]>('/api/media/folders', { key: 'media-folders', server: false })
const { data: generatedAdsData, pending: generatedAdsPending, refresh: refreshGeneratedAds } = await useFetch<GeneratedAdItem[]>('/api/media/generated', { key: 'media-generated', server: false })

const items = computed(() => data.value ?? [])
const folders = computed(() => foldersData.value ?? [])
const generatedAds = computed(() => generatedAdsData.value ?? [])

// ── Filtering ──
const activeFolder = ref<number | 'none' | 'generated' | null>(null)
const search = ref('')

const unorganizedCount = computed(() => items.value.filter(i => i.folderId === null).length)

const filteredItems = computed(() => {
  let list = items.value
  if (activeFolder.value === 'none') {
    list = list.filter(i => i.folderId === null)
  } else if (activeFolder.value !== null && activeFolder.value !== 'generated') {
    list = list.filter(i => i.folderId === activeFolder.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.filename.toLowerCase().includes(q) ||
      i.keywords.some(k => k.toLowerCase().includes(q)) ||
      (i.description ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

// ── Selection ──
const selectedIds = reactive(new Set<number>())

function toggleSelect(id: number) {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

function toggleSelectAll() {
  if (selectedIds.size === filteredItems.value.length) {
    selectedIds.clear()
  } else {
    filteredItems.value.forEach(i => selectedIds.add(i.id))
  }
}

// ── Bulk operations ──
const showMoveDropdown = ref(false)

async function bulkMove(folderId: number | null) {
  showMoveDropdown.value = false
  await $fetch('/api/media/bulk', {
    method: 'POST',
    body: { action: 'move', ids: [...selectedIds], folderId },
  })
  selectedIds.clear()
  await Promise.all([refresh(), refreshFolders()])
}

async function bulkDelete() {
  const count = selectedIds.size
  if (!confirm(`Delete ${count} image${count === 1 ? '' : 's'}? This cannot be undone.`)) return
  const result = await $fetch<{ deleted: number; skipped: Array<{ filename: string; reason: string }> }>('/api/media/bulk', {
    method: 'POST',
    body: { action: 'delete', ids: [...selectedIds] },
  })
  selectedIds.clear()
  await Promise.all([refresh(), refreshFolders()])
  if (result.skipped.length > 0) {
    const skippedNames = result.skipped.map(s => `• ${s.filename} (${s.reason})`).join('\n')
    alert(`${result.deleted} deleted. ${result.skipped.length} skipped:\n\n${skippedNames}`)
  }
}

// ── Single delete (uploaded) ──
async function deleteSingle(item: MediaItem) {
  if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return
  await $fetch(`/api/uploads/${item.id}`, { method: 'DELETE' })
  await Promise.all([refresh(), refreshFolders()])
}

// ── Delete generated ad ──
async function deleteGeneratedAd(ad: GeneratedAdItem) {
  if (!confirm(`Delete this generated ad from "${ad.profileName}"? This cannot be undone.`)) return
  await $fetch(`/api/generated-ads/${ad.id}`, { method: 'DELETE' })
  await refreshGeneratedAds()
}

// ── Save to Library ──
const savingToLibraryId = ref<number | null>(null)
const savedToLibraryId = ref<number | null>(null)
const saveToLibraryError = reactive<Record<number, string>>({})

async function saveToLibrary(ad: GeneratedAdItem) {
  savingToLibraryId.value = ad.id
  delete saveToLibraryError[ad.id]
  savedToLibraryId.value = null
  try {
    await $fetch('/api/media/save-from-generated', {
      method: 'POST',
      body: { generatedAdId: ad.id },
    })
    savedToLibraryId.value = ad.id
    await Promise.all([refresh(), refreshFolders()])
    setTimeout(() => { if (savedToLibraryId.value === ad.id) savedToLibraryId.value = null }, 3000)
  } catch (e: unknown) {
    saveToLibraryError[ad.id] =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to save'
        : 'Failed to save'
  } finally {
    savingToLibraryId.value = null
  }
}

// ── Image revision ──
const reviseR2Key = ref<string | null>(null)
const showReviseModal = ref(false)

function openRevise(r2Key: string | null) {
  if (!r2Key) return
  reviseR2Key.value = r2Key
  showReviseModal.value = true
}

async function onRevised() {
  await Promise.all([refresh(), refreshFolders()])
}

// ── Copy link ──
const copiedId = ref<string | null>(null)

async function copyLink(item: MediaItem) {
  const url = `${window.location.origin}/api/images/${item.r2Key}`
  await navigator.clipboard.writeText(url)
  copiedId.value = `upload-${item.id}`
  setTimeout(() => { copiedId.value = null }, 2000)
}

async function copyGeneratedLink(ad: GeneratedAdItem) {
  const url = `${window.location.origin}/api/images/${ad.r2Key}`
  await navigator.clipboard.writeText(url)
  copiedId.value = `gen-${ad.id}`
  setTimeout(() => { copiedId.value = null }, 2000)
}

// ── Upload ──
const uploading = ref(false)
const uploadError = ref('')

async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploadError.value = ''
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch('/api/upload', { method: 'POST', body: fd })
    await Promise.all([refresh(), refreshFolders()])
  } catch {
    uploadError.value = 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

// ── Edit metadata modal ──
const editItem = ref<MediaItem | null>(null)
const editForm = reactive({
  description: '',
  keywords: [] as string[],
  altText: '',
  source: '',
  copyright: '',
  folderId: null as number | null,
  locked: false,
})
const keywordInput = ref('')
const editSaving = ref(false)
const editError = ref('')

function openEdit(item: MediaItem) {
  editItem.value = item
  editForm.description = item.description ?? ''
  editForm.keywords = [...item.keywords]
  editForm.altText = item.altText ?? ''
  editForm.source = item.source ?? ''
  editForm.copyright = item.copyright ?? ''
  editForm.folderId = item.folderId
  editForm.locked = item.locked
  keywordInput.value = ''
  editError.value = ''
}

function addKeyword() {
  const kw = keywordInput.value.replace(/,/g, '').trim()
  if (kw && !editForm.keywords.includes(kw)) editForm.keywords.push(kw)
  keywordInput.value = ''
}

function removeKeyword(kw: string) {
  editForm.keywords = editForm.keywords.filter(k => k !== kw)
}

async function saveEdit() {
  if (!editItem.value) return
  editSaving.value = true
  editError.value = ''
  try {
    await $fetch(`/api/media/${editItem.value.id}`, {
      method: 'PUT',
      body: {
        description: editForm.description || null,
        keywords: editForm.keywords,
        altText: editForm.altText || null,
        source: editForm.source || null,
        copyright: editForm.copyright || null,
        folderId: editForm.folderId,
        locked: editForm.locked,
      },
    })
    editItem.value = null
    await Promise.all([refresh(), refreshFolders()])
  } catch (e: unknown) {
    editError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to save'
        : 'Failed to save'
  } finally {
    editSaving.value = false
  }
}

// ── Folder management modal ──
const showFolderModal = ref(false)
const newFolderName = ref('')
const folderError = ref('')
const renamingFolderId = ref<number | null>(null)
const renameValue = ref('')

async function createFolder() {
  if (!newFolderName.value.trim()) return
  folderError.value = ''
  try {
    await $fetch('/api/media/folders', { method: 'POST', body: { name: newFolderName.value.trim() } })
    newFolderName.value = ''
    await refreshFolders()
  } catch (e: unknown) {
    folderError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to create folder'
        : 'Failed to create folder'
  }
}

function startRename(folder: Folder) {
  renamingFolderId.value = folder.id
  renameValue.value = folder.name
}

async function commitRename(id: number) {
  if (!renameValue.value.trim()) { renamingFolderId.value = null; return }
  try {
    await $fetch(`/api/media/folders/${id}`, { method: 'PUT', body: { name: renameValue.value.trim() } })
    renamingFolderId.value = null
    await refreshFolders()
  } catch { renamingFolderId.value = null }
}

async function deleteFolder(id: number) {
  folderError.value = ''
  try {
    await $fetch(`/api/media/folders/${id}`, { method: 'DELETE' })
    if (activeFolder.value === id) activeFolder.value = null
    await Promise.all([refresh(), refreshFolders()])
  } catch (e: unknown) {
    folderError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to delete folder'
        : 'Failed to delete folder'
  }
}
</script>
