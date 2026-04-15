<template>
  <div class="flex flex-1 flex-col items-center justify-center px-4 py-24">
    <div class="w-full max-w-2xl text-center">
      <div style="width: 64px; height: 64px; margin: 0 auto 1.5rem;">
        <img
          src="/cogitations-logo-only.svg"
          alt="Cogitations logo"
          style="display: block; width: 64px; height: 64px; max-width: none;"
        />
      </div>

      <h1 class="text-4xl font-bold tracking-tight text-slate-900">
        Cogitations Media &amp; Ad Management
      </h1>
      <p class="mt-4 text-lg text-slate-500">
        A private platform for the Cogitations family of companies. Organize your media assets,
        build ad profiles, and generate polished ads — all in one place.
      </p>

      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Media card -->
        <NuxtLink
          to="/media"
          class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 group-hover:text-emerald-700">
            Media Library
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            Upload, organize, and annotate images. Assign keywords, descriptions, and alt text.
            Group assets into folders and track where each image is used.
          </p>
          <span class="mt-5 inline-block text-sm font-medium text-emerald-600 group-hover:underline">
            Open Media Library →
          </span>
        </NuxtLink>

        <!-- Ads card -->
        <NuxtLink
          to="/ads"
          class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 group-hover:text-blue-700">
            Ad Profiles
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            Create ad profiles backed by Templated.io layouts. Set default headlines, images,
            and copy — then generate polished ad images with a single click.
          </p>
          <span class="mt-5 inline-block text-sm font-medium text-blue-600 group-hover:underline">
            Open Ad Profiles →
          </span>
        </NuxtLink>
        <!-- templated.io card -->
        <a
          href="https://app.templated.io"
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 group-hover:text-violet-700">
            templated.io
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            Design and edit ad templates in the Templated.io visual editor.
            Create layouts, position elements, and publish templates for use in Ad Profiles.
          </p>
          <span class="mt-5 inline-block text-sm font-medium text-violet-600 group-hover:underline">
            Open templated.io →
          </span>
        </a>
      </div>
    </div>
  </div>
</template>
