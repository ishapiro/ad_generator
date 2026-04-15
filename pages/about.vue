<template>
  <div class="mx-auto max-w-wide px-4 py-10 sm:py-12">
    <header class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        About
      </p>
      <h1 class="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
        Irv Shapiro
      </h1>
      <p class="mt-4 text-base text-slate-600 sm:text-lg">
        I&apos;ve spent more than forty years founding and scaling technology companies —
        from Metamor Technologies (500+ employees, successful exit) to DialogTech ($60M+
        in VC funding) — and I&apos;m still building. The Cogitations Ad Generator is one of
        the tools I use to explore AI-powered content creation for modern marketing.
      </p>
    </header>

    <section class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)] lg:items-start">
      <article class="space-y-8 text-base leading-relaxed text-slate-700">
        <section>
          <h2 class="text-xl font-semibold text-slate-900">
            Creating as a way of life
          </h2>
          <p class="mt-3">
            I&apos;ve always been drawn to the point where ideas meet execution — the moment
            when a sketch on a whiteboard becomes a system serving real people. Over the
            decades that&apos;s meant writing code, designing products, raising capital,
            leading teams, and making more than a few mistakes along the way.
          </p>
          <p class="mt-3">
            Those experiences taught me that the craft of building technology companies is
            learnable. There are patterns that repeat — in hiring, in leadership, in
            go‑to‑market — and if you can see those patterns clearly, you can move faster
            with more confidence. In today&apos;s AI-centric world, those patterns are
            evolving faster than ever.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-900">
            A timeline of companies &amp; creation
          </h2>
          <ul class="mt-3 space-y-2">
            <li>
              <span class="font-medium text-slate-900">Early career:</span>
              data communications, networking, and custom software when &quot;the cloud&quot;
              still meant racks in a closet.
            </li>
            <li>
              <span class="font-medium text-slate-900">Metamor Technologies:</span>
              founding and leading a technology services organization that grew to more
              than 500 employees serving enterprise customers and achieved a successful exit.
            </li>
            <li>
              <span class="font-medium text-slate-900">DialogTech and beyond:</span>
              founding and scaling a marketing analytics platform that helped marketers
              understand which calls, campaigns, and conversations were actually driving
              business, culminating in a $100M exit.
            </li>
            <li>
              <span class="font-medium text-slate-900">MakeWithTech:</span>
              an experiment in teaching and community that grew into a way for thousands
              of makers to discover 3D printing, electronics, and hands‑on projects.
            </li>
            <li>
              <span class="font-medium text-slate-900">Cogitations:</span>
              ongoing exploration of AI-powered tools for founders, marketers, and teams —
              including this ad generator.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-900">
            Coaching, boards, and due diligence
          </h2>
          <p class="mt-3">
            In addition to building tools, I&apos;m available for a limited number of
            engagements in three areas:
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li>Executive coaching for technical and product leaders</li>
            <li>Independent board roles for growth‑stage technology companies</li>
            <li>Venture technology due diligence for investors and acquisition teams</li>
          </ul>
          <p class="mt-3">
            To explore whether I&apos;m a fit for your company or fund, you can:
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Visit
              <a
                href="https://cogitations.com"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600"
              >
                cogitations.com
              </a>
              for a broader view of my work.
            </li>
            <li>
              Connect with me on
              <a
                href="https://www.linkedin.com/in/irvshapiro"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600"
              >
                LinkedIn
              </a>
              to see more of my background.
            </li>
          </ul>
          <p class="mt-3">
            Or simply contact me at
            <span class="font-medium">ishapiro at cogitations dot com</span>.
          </p>
        </section>
      </article>

      <aside class="space-y-6 rounded-2xl border border-slate-200 border-t-4 border-t-amber-400 bg-slate-50/80 p-6 text-sm text-slate-700">
        <div>
          <h2 class="text-base font-semibold text-slate-900">
            Quick facts
          </h2>
          <ul class="mt-3 space-y-1.5">
            <li>➤ 40+ years founding and scaling technology companies</li>
            <li>➤ Metamor Technologies — 500+ employees, successful exit</li>
            <li>➤ DialogTech — $60M+ in VC funding, $100M exit</li>
            <li>➤ Deep focus on how founders build and scale teams in the AI era</li>
          </ul>
        </div>

        <div>
          <h2 class="text-base font-semibold text-slate-900">
            About this tool
          </h2>
          <ul class="mt-3 space-y-1.5">
            <li>• AI-powered ad image generation using Templated.io</li>
            <li>• Manage multiple ad profiles with custom fields and prompts</li>
            <li>• Generate and iterate on ad creative without a design team</li>
          </ul>
        </div>

        <div>
          <h2 class="text-base font-semibold text-slate-900">
            Get started
          </h2>
          <p class="mt-3">
            Create an ad profile from a template and start generating ad images.
          </p>
          <div class="mt-4">
            <NuxtLink
              to="/"
              class="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 touch-manipulation"
            >
              View ad profiles
            </NuxtLink>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
