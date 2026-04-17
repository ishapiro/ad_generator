<template>
  <div class="mx-auto max-w-wide px-4 py-10 sm:py-12">
    <header class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Documentation
      </p>
      <h1 class="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
        How to Use the Ad Manager
      </h1>
      <p class="mt-4 text-base text-slate-600 sm:text-lg">
        The Cogitations Media/Ad Management system lets you create professional ad images using
        design templates, AI-generated copy, and your own media — without a design team.
        This guide explains every feature and how they fit together.
      </p>
    </header>

    <!-- Quick-start flow -->
    <section class="mt-10">
      <h2 class="text-xl font-semibold text-slate-900">Quick-start overview</h2>
      <p class="mt-3 text-base text-slate-600">
        Every ad is created through a three-step workflow. You must complete step 1 before step 2,
        and step 2 before step 3.
      </p>
      <ol class="mt-6 space-y-4">
        <li class="flex gap-4">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">1</div>
          <div>
            <p class="font-semibold text-slate-900">Create a template in Templated.io</p>
            <p class="mt-1 text-sm text-slate-600">Design your ad layout externally at <a href="https://app.templated.io" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600">app.templated.io</a>. The template defines the visual structure — text layers, image layers, colors, fonts, and dimensions.</p>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">2</div>
          <div>
            <p class="font-semibold text-slate-900">Create an Ad Profile from that template</p>
            <p class="mt-1 text-sm text-slate-600">In the Ad Manager, browse the Template Gallery, select your template, and map each layer to your copy fields (headline, body text, CTA, images, etc.). This creates an Ad Profile.</p>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">3</div>
          <div>
            <p class="font-semibold text-slate-900">Generate ads from the Ad Profile</p>
            <p class="mt-1 text-sm text-slate-600">Open the Ad Profile, supply prompts for your AI image generation, refine your copy with AI assistance if needed, then click Generate. The system sends your content and image prompts to Templated.io and fal.ai, and returns a finished ad image.</p>
          </div>
        </li>
      </ol>
    </section>

    <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)] lg:items-start">
      <article class="space-y-10 text-base leading-relaxed text-slate-700">

        <!-- Projects -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Projects</h2>
          <p class="mt-3">
            Everything in the Ad Manager is organized inside a <strong>Project</strong>. A project
            represents a product, brand, campaign, or client. All ad profiles, media, and generated
            ads belong to a specific project.
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li>The home page lists every project you have access to.</li>
            <li>Click a project card to open the Project Hub — a dashboard linking to that project's ad profiles, media library, and the Templated.io editor.</li>
            <li>Admins can create new projects and assign team members from the Admin panel.</li>
            <li>When you are inside a project, a blue context bar appears below the top navigation showing the project name and quick links to Ad Profiles and Media.</li>
          </ul>
        </section>

        <!-- Templated.io API Key -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Templated.io API Key</h2>
          <p class="mt-3">
            Each project requires a <strong>Templated.io API key</strong> to connect to your Templated.io account.
            This key allows the Ad Manager to read your published templates and submit rendering requests on your behalf.
          </p>
          <p class="mt-3">
            To find your API key, log in to
            <a href="https://app.templated.io" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600">app.templated.io</a>,
            open your account settings, and copy the API key from the API section.
          </p>
          <p class="mt-3">
            When you open a project for the first time you will be prompted to enter the key. You can also update it
            later from the Project Hub settings.
          </p>
          <p class="mt-3">
            <strong>Your API key is never sent to your browser.</strong> It is stored encrypted on our servers and
            used only in server-side requests to Templated.io — it is never included in any page, script, or
            API response visible to the front end.
          </p>
        </section>

        <!-- Templated.io -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Step 1 — Create a template in Templated.io</h2>
          <p class="mt-3">
            The Ad Manager does not have a built-in design editor. Instead, it relies on
            <a href="https://app.templated.io" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600">Templated.io</a>
            — a separate service — for the visual design layer.
          </p>
          <p class="mt-3">
            <strong>You must create and publish a template in Templated.io before you can create
            an Ad Profile in this app.</strong>
          </p>
          <p class="mt-3">In Templated.io you will:</p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li>Define the canvas size (e.g. 1080 × 1080 for a square social ad).</li>
            <li>Add text layers — each layer has a name and contains one piece of text (headline, subheadline, body copy, CTA button, etc.).</li>
            <li>Add image layers for background images or hero photos.</li>
            <li>Style everything with fonts, colors, and layout tools.</li>
            <li>Publish or save the template so it appears in this app's Template Gallery.</li>
          </ul>
          <p class="mt-3">
            The "templated.io" link in the top navigation opens Templated.io in a new tab so you
            can switch back and forth without losing your place.
          </p>
        </section>

        <!-- Template Gallery -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Template Gallery</h2>
          <p class="mt-3">
            Navigate to <strong>Templates</strong> from the Project Hub (or via the context bar)
            to see a grid of every published Templated.io template linked to your account.
            Each card shows a thumbnail, the template name, and the canvas dimensions and
            layer count.
          </p>
          <p class="mt-3">
            Click any template card to start creating a new Ad Profile from that template.
          </p>
        </section>

        <!-- Ad Profiles -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Step 2 — Create an Ad Profile</h2>
          <p class="mt-3">
            An <strong>Ad Profile</strong> connects a Templated.io template to your copy and
            image content. It stores:
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li><strong>Name</strong> — a label to identify this profile (e.g. "Summer Sale — Square").</li>
            <li><strong>Headline, Subheadline, Body Text, CTA</strong> — the text that fills the template's text layers.</li>
            <li><strong>Background Description</strong> — a description used when an AI generates background imagery.</li>
            <li><strong>Hero Image Prompt</strong> — a prompt for AI-generated hero photos.</li>
            <li><strong>Bullet Steps</strong> — an optional list of icon + label pairs (e.g. feature callouts).</li>
            <li><strong>Layer mapping</strong> — which field goes into which Templated.io layer.</li>
          </ul>
          <p class="mt-3">
            During creation, the template configuration page shows every layer in the template.
            For each layer you choose what content to put in it: a static value, one of your
            copy fields, an uploaded image from your Media Library, or an AI-generated image
            described by a prompt.
          </p>
          <p class="mt-3">
            Once saved, the Ad Profile appears in the <strong>Ad Profiles</strong> list for the project.
            You can create multiple Ad Profiles from the same template — useful for A/B testing
            different copy, or for producing different ad sizes from a family of templates.
          </p>
        </section>

        <!-- Generating ads -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Step 3 — Generate an ad</h2>
          <p class="mt-3">
            Open an Ad Profile by clicking <strong>Edit / View</strong> in the Ad Profiles list.
            The profile editor shows a preview of the most recent generated ad (if any) alongside
            all editable copy fields.
          </p>
          <p class="mt-3">When you are ready to produce an image:</p>
          <ol class="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Optionally use the AI copy tools (described below) to refine your text.</li>
            <li>Click <strong>Save Changes</strong> if you edited any fields.</li>
            <li>Click <strong>Generate Ad</strong> to send the profile to Templated.io. A new
            generated ad entry appears in the list with a "generating" status.</li>
            <li>Refresh or wait — the image appears when Templated.io finishes rendering.</li>
          </ol>
          <p class="mt-3">
            The <strong>View Completed Ads</strong> button opens a gallery of every ad image
            previously generated from this profile. You can download any image or save it to
            the project's Media Library for reuse.
          </p>
          <p class="mt-3">
            <strong>Generate All Copy with AI</strong> rewrites all text fields at once using
            a copy brief you supply — see the AI features section below.
          </p>

          <h3 class="mt-5 text-base font-semibold text-slate-900">How AI generates your images</h3>
          <p class="mt-2">
            When you click <strong>Generate Ad</strong>, the app handles images in two ways
            depending on how each image layer was configured in the Ad Profile:
          </p>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>AI-generated images</strong> — layers configured with a text prompt are sent
              to <strong>fal.ai Flux 2 Pro</strong>, a state-of-the-art text-to-image model.
              The prompt you wrote (e.g. the Hero Image Prompt or Background Description field) is
              used to generate a photorealistic or illustrative image at the exact dimensions
              required by the template. Each AI image is generated fresh on every render.
            </li>
            <li>
              <strong>Uploaded images</strong> — layers configured to use a Media Library image
              pull that photo directly from storage without any AI generation step.
            </li>
          </ul>
          <p class="mt-3">
            Once all image layers are ready — whether AI-generated or uploaded — they are sent
            to <strong>Templated.io</strong> along with all text layers. Templated.io composites
            everything into a single finished ad image at the template's exact pixel dimensions
            and returns it to the app, where it is saved and shown in the generated ads gallery.
          </p>
          <p class="mt-3">
            Writing good image prompts is key to high-quality results. Be specific about subject,
            style, lighting, and mood. For background layers, phrases like
            "solid flat warm coral background, no texture, no gradient" produce clean results
            that don't compete with text overlays.
          </p>
        </section>

        <!-- Media Library -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Media Library</h2>
          <p class="mt-3">
            Each project has a Media Library where you can upload and organize images.
            Uploaded images can be selected as the content for image layers in your Ad Profiles.
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li>Upload images by dragging and dropping or using the file picker.</li>
            <li>Organize images into custom folders using the sidebar.</li>
            <li>The <strong>Generated Ads</strong> virtual folder shows every ad image produced by the app.</li>
            <li>Save a generated ad to the Media Library so it can be used as a source image in future profiles.</li>
          </ul>
        </section>

        <!-- AI features -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">AI assistance</h2>
          <p class="mt-3">
            The Ad Manager uses <strong>Google Gemini</strong> AI in several places to help
            you write better copy and review your ads faster.
          </p>

          <h3 class="mt-5 text-base font-semibold text-slate-900">Generate All Copy</h3>
          <p class="mt-2">
            Available on the Ad Profile editor via the <strong>Generate All Copy with AI</strong>
            button. Supply a short copy brief — a sentence or two describing your product,
            audience, and goal — and Gemini generates a complete set of copy fields
            (headline, subheadline, body text, CTA, background description, hero image prompt)
            in one step. You can accept all fields, accept individual ones, or discard and try again.
          </p>

          <h3 class="mt-5 text-base font-semibold text-slate-900">Rewrite a single field</h3>
          <p class="mt-2">
            Each text field in the Ad Profile editor has an <strong>AI rewrite</strong> option.
            Click it to open a modal where you can give a specific instruction
            (e.g. "make it more urgent" or "shorten to under 8 words") and Gemini rewrites
            just that field. You choose whether to apply the suggestion.
          </p>

          <h3 class="mt-5 text-base font-semibold text-slate-900">Review a generated ad</h3>
          <p class="mt-2">
            After an ad image is generated, you can send it to Gemini for a visual review.
            The AI analyzes the rendered image and responds to a prompt you provide —
            for example: "Does the text stand out against the background?" or
            "Is the CTA button readable on mobile?" This uses Gemini's vision capability
            and returns a written critique you can use to decide whether to revise and regenerate.
          </p>
        </section>

        <!-- Admin -->
        <section>
          <h2 class="text-xl font-semibold text-slate-900">Admin panel</h2>
          <p class="mt-3">
            Users with the <strong>Admin</strong> role have access to the Admin panel from the
            top navigation. Admin capabilities include:
          </p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5">
            <li><strong>User management</strong> — view all users, change their role (admin or member), suspend or unsuspend accounts, and invite new users by email.</li>
            <li><strong>Project management</strong> — create new projects, assign users to projects with an owner or editor role, and remove members.</li>
          </ul>
          <p class="mt-3">
            Regular members can only see and work within projects they have been assigned to.
          </p>
        </section>

      </article>

      <!-- Sidebar -->
      <aside class="space-y-6 rounded-2xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/80 p-6 text-sm text-slate-700 lg:sticky lg:top-6">

        <div>
          <h2 class="text-base font-semibold text-slate-900">Workflow at a glance</h2>
          <ol class="mt-3 space-y-2">
            <li class="flex gap-2"><span class="font-bold text-blue-600">1.</span> Design template in Templated.io</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">2.</span> Browse Template Gallery</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">3.</span> Create Ad Profile</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">4.</span> Refine copy (with AI)</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">5.</span> Click Generate Ad</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">6.</span> Review result (with AI)</li>
            <li class="flex gap-2"><span class="font-bold text-blue-600">7.</span> Iterate or download</li>
          </ol>
        </div>

        <div>
          <h2 class="text-base font-semibold text-slate-900">Where AI can help</h2>
          <ul class="mt-3 space-y-2">
            <li>• <strong>Generate All Copy</strong> — write all fields from a brief</li>
            <li>• <strong>Rewrite a field</strong> — refine a single piece of copy</li>
            <li>• <strong>Review generated ad</strong> — visual critique of the finished image</li>
          </ul>
        </div>

        <div>
          <h2 class="text-base font-semibold text-slate-900">Key concepts</h2>
          <ul class="mt-3 space-y-1.5">
            <li><strong>Template</strong> — visual layout created in Templated.io</li>
            <li><strong>Ad Profile</strong> — template + your copy and image mappings</li>
            <li><strong>Generated Ad</strong> — the rendered image produced by Templated.io</li>
            <li><strong>Media Library</strong> — your uploaded and generated images</li>
            <li><strong>Project</strong> — container for all of the above</li>
          </ul>
        </div>

        <div>
          <h2 class="text-base font-semibold text-slate-900">Quick links</h2>
          <ul class="mt-3 space-y-2">
            <li>
              <a
                href="https://app.templated.io"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600"
              >
                Open Templated.io ↗
              </a>
            </li>
            <li>
              <NuxtLink to="/" class="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600">
                Go to Projects
              </NuxtLink>
            </li>
          </ul>
        </div>

      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
