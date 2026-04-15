<template>
  <div style="padding: 2rem; font-family: sans-serif;">

    <h1 style="margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: bold;">
      Template grid — raw inline CSS, zero Tailwind classes
    </h1>

    <!-- 3-column grid using raw CSS -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">

      <!-- Card 1 — full width 100% / height auto -->
      <a href="#" style="display: block; text-decoration: none; color: inherit;">
        <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            src="https://templated-assets.s3.amazonaws.com/public/thumbnail/50f718b2-4815-468e-a7af-fa7db77f10dd.webp"
            alt="Template 1"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
        </div>
        <p style="margin-top: 0.5rem; font-weight: 600;">Card 1 — width:100% height:auto max-width:none</p>
      </a>

      <!-- Card 2 — same -->
      <a href="#" style="display: block; text-decoration: none; color: inherit;">
        <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            src="https://templated-assets.s3.amazonaws.com/public/thumbnail/50f718b2-4815-468e-a7af-fa7db77f10dd.webp"
            alt="Template 2"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
        </div>
        <p style="margin-top: 0.5rem; font-weight: 600;">Card 2 — same</p>
      </a>

      <!-- Card 3 — same -->
      <a href="#" style="display: block; text-decoration: none; color: inherit;">
        <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            src="https://templated-assets.s3.amazonaws.com/public/thumbnail/50f718b2-4815-468e-a7af-fa7db77f10dd.webp"
            alt="Template 3"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
        </div>
        <p style="margin-top: 0.5rem; font-weight: 600;">Card 3 — same</p>
      </a>

      <!-- Card 4 — same -->
      <a href="#" style="display: block; text-decoration: none; color: inherit;">
        <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            src="https://templated-assets.s3.amazonaws.com/public/thumbnail/50f718b2-4815-468e-a7af-fa7db77f10dd.webp"
            alt="Template 4"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
        </div>
        <p style="margin-top: 0.5rem; font-weight: 600;">Card 4 — same</p>
      </a>

    </div>

  </div>
</template>

<script setup lang="ts">
// no logic
</script>
