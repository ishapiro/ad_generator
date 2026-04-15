<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <NuxtLink to="/" class="mb-8 inline-block text-sm text-blue-600 hover:underline">
      ← Back to Ad Profiles
    </NuxtLink>

    <h1 class="mb-2 text-3xl font-bold text-slate-900">Privacy Policy</h1>
    <p class="mb-8 text-sm text-slate-500">Last Updated: March 27, 2026</p>

    <div class="space-y-8 text-slate-700">
      <p>
        At <strong class="font-medium text-slate-900">Cogitations Media/Ad Management System</strong>, operated by Cogitations, LLC,
        we respect your privacy and are committed to protecting your personal data. This policy outlines how we handle
        information when you use our services.
      </p>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">1. Information We Collect</h2>
        <p class="mb-3">
          When you use this application we may collect information necessary to provide the service, including:
        </p>
        <ul class="list-disc space-y-1 pl-6">
          <li><strong class="font-medium">Identity Data:</strong> Your name and account information.</li>
          <li><strong class="font-medium">Contact Data:</strong> Your email address.</li>
          <li><strong class="font-medium">Usage Data:</strong> Ad profiles, templates, and generated images you create.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">2. How We Use Your Data</h2>
        <p class="mb-3">We use your data strictly for the following purposes:</p>
        <ul class="list-disc space-y-1 pl-6">
          <li>To operate and maintain your account and ad profiles.</li>
          <li>To generate ad images using connected third-party services.</li>
          <li>To send essential service-related communications to your email.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">3. Data Protection</h2>
        <p class="mb-3">We protect your data using industry-standard security protocols:</p>
        <ul class="list-disc space-y-1 pl-6">
          <li><strong class="font-medium">Encryption:</strong> All data transmitted between your browser and our servers is encrypted via SSL/TLS.</li>
          <li><strong class="font-medium">No Data Sales:</strong> We will not sell, trade, or provide your personal data to any third-party organizations or ad networks.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">4. Data Deletion</h2>
        <p class="mb-3">You have full control over the data we store. You may request deletion at any time.</p>
        <p>
          <strong class="font-medium">To delete your data:</strong> Email us at
          <a href="mailto:ishapiro@cogitations.com" class="text-blue-600 hover:underline">ishapiro@cogitations.com</a>
          with the subject "Data Deletion Request." We will purge your account and all associated data within 30 days.
        </p>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">5. Changes to This Policy</h2>
        <p>
          We may update this policy to reflect changes in our practices or for legal reasons. We encourage users to
          check this page regularly for updates.
        </p>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">6. Contact Information</h2>
        <p>
          For questions regarding this policy or your data, please contact:<br />
          <strong class="font-medium">Email:</strong>
          <a href="mailto:ishapiro@cogitations.com" class="text-blue-600 hover:underline">ishapiro@cogitations.com</a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
