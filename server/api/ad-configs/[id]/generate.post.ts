import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'
import { mimeToExt, useR2 } from '~/server/utils/r2'

interface LayerSelection {
  layer: string
  type: string
  value?: string
  prompt?: string
  r2Key?: string
  imageMode?: string
  included?: boolean
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
  const session = await requireSession(event)
  const configId = Number(getRouterParam(event, 'id'))
  if (!configId) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [config] = await db.select().from(adConfigs).where(eq(adConfigs.id, configId)).limit(1)
  if (!config) throw createError({ statusCode: 404, message: 'Ad config not found' })
  if (config.projectId && session.role !== 'admin') {
    await requireProjectAccess(event, config.projectId)
  }

  const cfg = useRuntimeConfig(event)
  const falKey = cfg.falKey as string
  const templatedApiKey = cfg.templatedApiKey as string
  const templatedDesignId = config.templateId ?? ''
  const publicBaseUrl = ((cfg.publicBaseUrl as string) || '').replace(/\/$/, '')
  const tempStorageUrl = ((cfg.tempStorageUrl as string) || 'https://adgen.cogitations.com').replace(/\/$/, '')
  const sessionSecret = cfg.sessionSecret as string

  if (!falKey || !templatedApiKey || !templatedDesignId) {
    throw createError({ statusCode: 500, message: 'Missing API credentials or templateId on ad config' })
  }

  const r2 = useR2(event)
  // Tracks temp R2 keys written for this render so they can be deleted after Templated.io
  // fetches them. A lifecycle rule on the 'tmp-' prefix is the safety-net fallback.
  const tmpKeys: Array<{ key: string; remote: boolean }> = []

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
    const layerSelections: LayerSelection[] = (JSON.parse(config.templateLayers || '[]') as LayerSelection[])
      .filter(l => l.included !== false)

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
        } else if (sel.type === 'image' && sel.imageMode === 'upload') {
          if (!sel.r2Key) {
            console.warn(`[generate] SKIP layer '${sel.layer}': upload mode but no r2Key saved`)
          } else {
            const r2Object = await r2.get(sel.r2Key)
            if (!r2Object) {
              throw new Error(`Uploaded image not found in R2 for layer '${sel.layer}': ${sel.r2Key}`)
            }
            const imageBytes = await r2Object.arrayBuffer()
            const contentType = r2Object.httpMetadata?.contentType ?? 'image/png'
            let imageUrl: string
            if (publicBaseUrl) {
              // Production: write temp file directly to local R2 binding, serve via this Worker's URL
              const tmpKey = `tmp-${crypto.randomUUID()}.${mimeToExt(contentType)}`
              await r2.put(tmpKey, imageBytes, { httpMetadata: { contentType } })
              tmpKeys.push({ key: tmpKey, remote: false })
              imageUrl = `${publicBaseUrl}/api/images/${tmpKey}`
              console.log(`[generate] upload layer '${sel.layer}': staged as ${tmpKey}, url=${imageUrl}`)
            } else {
              // Local dev: POST image bytes to production Worker's temp-images API so
              // Templated.io (an external service) can reach them via a public URL
              const uploadRes = await fetch(`${tempStorageUrl}/api/temp-images`, {
                method: 'POST',
                headers: {
                  'Content-Type': contentType,
                  'X-Internal-Secret': sessionSecret,
                  'X-Filename': sel.r2Key,
                },
                body: imageBytes,
              })
              if (!uploadRes.ok) {
                const errText = await uploadRes.text()
                throw new Error(`Temp upload to ${tempStorageUrl} failed: ${uploadRes.status} — ${errText}`)
              }
              const { key, url } = await uploadRes.json() as { key: string; url: string }
              tmpKeys.push({ key, remote: true })
              imageUrl = url
              console.log(`[generate] local dev: upload layer '${sel.layer}': staged as ${key} on ${tempStorageUrl}, url=${imageUrl}`)
            }
            templatedLayers[sel.layer] = { image_url: imageUrl }
          }
        } else if (sel.type === 'image' && sel.imageMode !== 'upload' && !sel.prompt) {
          console.warn(`[generate] SKIP layer '${sel.layer}': generate mode but no prompt saved`)
        }
      }
      for (const [i, job] of generateJobs.entries()) {
        templatedLayers[job.layer] = { image_url: generatedUrls[i]! }
      }
      console.log('[generate] templatedLayers =', JSON.stringify(templatedLayers))
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

    const renderRawBody = await renderRes.text()
    console.log(`[generate] Templated.io response: ${renderRes.status} ${renderRes.statusText}`)
    console.log(`[generate] Templated.io body: ${renderRawBody}`)
    if (!renderRes.ok) {
      throw new Error(`Templated API Error: ${renderRes.status} ${renderRes.statusText} — ${renderRawBody}`)
    }

    const renderResult = JSON.parse(renderRawBody) as { url: string; status: string }
    if (!renderResult.url) {
      throw new Error(`Templated API returned no image URL: ${JSON.stringify(renderResult)}`)
    }

    // Fetch rendered image from Templated URL and upload to R2
    const imageRes = await fetch(renderResult.url)
    if (!imageRes.ok) throw new Error(`Failed to fetch rendered image: ${imageRes.status}`)
    const imageBuffer = await imageRes.arrayBuffer()
    const r2Key = `${crypto.randomUUID()}.jpg`
    await r2.put(r2Key, imageBuffer, { httpMetadata: { contentType: 'image/jpeg' } })

    const [completed] = await db
      .update(generatedAds)
      .set({ status: 'complete', r2Key })
      .where(eq(generatedAds.id, genRecord.id))
      .returning()

    // Clean up temp R2 keys now that Templated.io has finished fetching them
    if (tmpKeys.length > 0) {
      await Promise.all(tmpKeys.map(({ key, remote }) =>
        remote
          ? fetch(`${tempStorageUrl}/api/temp-images/${key}`, {
              method: 'DELETE',
              headers: { 'X-Internal-Secret': sessionSecret },
            })
              .then(r => { if (!r.ok) console.warn(`[generate] failed to delete remote tmp key ${key}: ${r.status}`) })
              .catch(e => console.warn(`[generate] failed to delete remote tmp key ${key}:`, e))
          : r2.delete(key).catch(e => console.warn(`[generate] failed to delete tmp key ${key}:`, e)),
      ))
    }

    return completed
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(generatedAds)
      .set({ status: 'error', errorMessage: message })
      .where(eq(generatedAds.id, genRecord.id))
    // Best-effort cleanup of any temp keys written before the failure
    if (tmpKeys.length > 0) {
      await Promise.all(tmpKeys.map(({ key, remote }) =>
        remote
          ? fetch(`${tempStorageUrl}/api/temp-images/${key}`, {
              method: 'DELETE',
              headers: { 'X-Internal-Secret': sessionSecret },
            })
              .then(r => { if (!r.ok) console.warn(`[generate] failed to delete remote tmp key ${key}: ${r.status}`) })
              .catch(e => console.warn(`[generate] failed to delete remote tmp key ${key}:`, e))
          : r2.delete(key).catch(e => console.warn(`[generate] failed to delete tmp key ${key}:`, e)),
      ))
    }
    throw createError({ statusCode: 500, message })
  }
})
