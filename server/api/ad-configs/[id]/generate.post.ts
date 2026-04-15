import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'
import { useR2 } from '~/server/utils/r2'

interface LayerSelection {
  layer: string
  type: string
  value?: string
  prompt?: string
  r2Key?: string
  imageMode?: string
}

interface BulletStep {
  icon: string
  label: string
}

async function falSubscribe(
  falKey: string,
  model: string,
  input: Record<string, unknown>,
): Promise<string> {
  const submitRes = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!submitRes.ok) {
    const err = await submitRes.text()
    throw new Error(`Fal submit error: ${submitRes.status} — ${err}`)
  }
  const { request_id } = await submitRes.json() as { request_id: string }

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, 3000))
    const statusRes = await fetch(`https://queue.fal.run/${model}/requests/${request_id}/status`, {
      headers: { Authorization: `Key ${falKey}` },
    })
    const status = await statusRes.json() as { status: string }
    if (status.status === 'COMPLETED') break
    if (status.status === 'FAILED') throw new Error(`Fal job failed: ${request_id}`)
  }

  const resultRes = await fetch(`https://queue.fal.run/${model}/requests/${request_id}`, {
    headers: { Authorization: `Key ${falKey}` },
  })
  if (!resultRes.ok) throw new Error(`Fal result fetch error: ${resultRes.status}`)
  const result = await resultRes.json() as { images: Array<{ url: string }> }
  const url = result.images[0]?.url
  if (!url) throw new Error(`Fal returned no image for request ${request_id}`)
  return url
}

export default defineEventHandler(async (event) => {
  const configId = Number(getRouterParam(event, 'id'))
  if (!configId) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [config] = await db.select().from(adConfigs).where(eq(adConfigs.id, configId)).limit(1)
  if (!config) throw createError({ statusCode: 404, message: 'Ad config not found' })

  const cfg = useRuntimeConfig(event)
  const falKey = cfg.falKey as string
  const templatedApiKey = cfg.templatedApiKey as string
  const templatedDesignId = config.templateId ?? ''
  const publicBaseUrl = (cfg.publicBaseUrl as string) || ''

  if (!falKey || !templatedApiKey || !templatedDesignId) {
    throw createError({ statusCode: 500, message: 'Missing API credentials or templateId on ad config' })
  }

  // Fetch template dimensions so fal.ai images match the template's aspect ratio
  const tplRes = await fetch(`https://api.templated.io/v1/template/${templatedDesignId}`, {
    headers: { Authorization: `Bearer ${templatedApiKey}` },
  })
  const tplMeta = tplRes.ok
    ? await tplRes.json() as { width?: number; height?: number }
    : { width: 1024, height: 1024 }

  const templateWidth  = tplMeta.width  ?? 1024
  const templateHeight = tplMeta.height ?? 1024

  // Scale to max 1024px on the longest side, round to nearest 8 (fal.ai requirement)
  const round8 = (n: number) => Math.round(n / 8) * 8
  const scale  = Math.min(1024 / Math.max(templateWidth, templateHeight), 1)
  const falImageSize = {
    width:  round8(templateWidth  * scale),
    height: round8(templateHeight * scale),
  }

  // Create a pending generated_ads record
  const [genRecord] = await db
    .insert(generatedAds)
    .values({ adConfigId: configId, status: 'generating', createdAt: new Date() })
    .returning()
  if (!genRecord) throw createError({ statusCode: 500, message: 'Failed to create generation record' })

  try {
    const layerSelections: LayerSelection[] = JSON.parse(config.templateLayers || '[]')

    let templatedLayers: Record<string, { text?: string; image_url?: string }>

    if (layerSelections.length > 0) {
      // ── Dynamic path: layer selections from template configurator ──

      // Separate image layers into AI-generate vs pre-uploaded
      const generateJobs = layerSelections
        .filter(sel => sel.type === 'image' && sel.imageMode !== 'upload' && sel.prompt)
        .map(sel => ({
          layer: sel.layer,
          promise: falSubscribe(falKey, 'fal-ai/flux-2-pro', {
            prompt: sel.prompt,
            image_size: falImageSize,
          }),
        }))

      const generatedUrls = await Promise.all(generateJobs.map(j => j.promise))

      // Build Templated.io layers object
      templatedLayers = {}
      for (const sel of layerSelections) {
        if (sel.type !== 'image' && sel.value !== undefined) {
          templatedLayers[sel.layer] = { text: sel.value }
        } else if (sel.type === 'image' && sel.imageMode === 'upload' && sel.r2Key) {
          if (!publicBaseUrl) {
            throw new Error(
              `Layer '${sel.layer}' uses an uploaded image but NUXT_PUBLIC_BASE_URL is not set. ` +
              'Set it to your deployed worker URL so Templated.io can fetch the image.',
            )
          }
          templatedLayers[sel.layer] = { image_url: `${publicBaseUrl}/api/images/${sel.r2Key}` }
        }
      }
      for (let i = 0; i < generateJobs.length; i++) {
        templatedLayers[generateJobs[i].layer] = { image_url: generatedUrls[i] }
      }
    } else {
      // ── Legacy path: hardcoded field mapping ──
      const steps: BulletStep[] = JSON.parse(config.bulletSteps || '[]')
      const bg = config.backgroundDescription

      const stepDescriptions = steps
        .map((s, i) => `${i + 1}. ${s.icon} icon beside the word "${s.label}"`)
        .join(', ')

      const [heroImageUrl, adBackgroundUrl, bulletListUrl] = await Promise.all([
        falSubscribe(falKey, 'fal-ai/flux-2-pro', {
          prompt: config.heroImagePrompt,
          image_size: falImageSize,
        }),
        falSubscribe(falKey, 'fal-ai/flux-2-pro', {
          prompt:
            `Solid flat ${bg} background. ` +
            'Completely uniform color, no texture, no noise, no gradient, no pattern, no objects. ' +
            'Pure flat color filling the entire canvas edge to edge.',
          image_size: falImageSize,
        }),
        falSubscribe(falKey, 'fal-ai/flux-2-pro', {
          prompt: (
            `Clean minimal flat UI graphic on a solid ${bg} background. ` +
            'No texture, no gradient, no pattern, no noise. ' +
            'Compose a vertical startup journey timeline that fills the entire canvas edge to edge. ' +
            'Zero padding and zero outer margins. ' +
            'Icons and labels should visually reach all four edges of the image area. ' +
            'Place a glowing blue vertical line on the center-left with small filled blue circles at each node. ' +
            'At each node, place a small flat blue icon on the left and a bold white label on the right. ' +
            'Keep icon and label alignment clean and consistent. ' +
            `Steps from top to bottom: ${stepDescriptions}. ` +
            'First item flush to the top edge, last item flush to the bottom edge. ' +
            'Distribute items evenly to fill the full height. ' +
            'Flat design, crisp edges, no photography, no border, no frame, no whitespace margins.'
          ),
          image_size: falImageSize,
        }),
      ])

      templatedLayers = {
        ad_background: { image_url: adBackgroundUrl },
        hero_image:    { image_url: heroImageUrl },
        bullet_list:   { image_url: bulletListUrl },
        headline:      { text: config.headline },
        subheadline:   { text: config.subheadline },
        body_copy:     { text: config.bodyText },
        cta_text:      { text: config.ctaText },
      }
    }

    // Compose with Templated.io
    const renderRes = await fetch('https://api.templated.io/v1/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${templatedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: templatedDesignId,
        format: 'jpg',
        layers: templatedLayers,
      }),
    })

    if (!renderRes.ok) {
      const errBody = await renderRes.text()
      throw new Error(`Templated API Error: ${renderRes.status} ${renderRes.statusText} — ${errBody}`)
    }

    const renderResult = await renderRes.json() as { url: string; status: string }
    if (!renderResult.url) {
      throw new Error(`Templated API returned no image URL: ${JSON.stringify(renderResult)}`)
    }

    // Fetch rendered image from Templated URL and upload to R2
    const imageRes = await fetch(renderResult.url)
    if (!imageRes.ok) throw new Error(`Failed to fetch rendered image: ${imageRes.status}`)
    const imageBuffer = await imageRes.arrayBuffer()
    const r2Key = `${crypto.randomUUID()}.jpg`
    const r2 = useR2(event)
    await r2.put(r2Key, imageBuffer, { httpMetadata: { contentType: 'image/jpeg' } })

    const [completed] = await db
      .update(generatedAds)
      .set({ status: 'complete', r2Key })
      .where(eq(generatedAds.id, genRecord.id))
      .returning()

    return completed
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(generatedAds)
      .set({ status: 'error', errorMessage: message })
      .where(eq(generatedAds.id, genRecord.id))
    throw createError({ statusCode: 500, message })
  }
})
