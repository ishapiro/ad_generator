import { and, desc, eq } from 'drizzle-orm'
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
    let newCache: Record<string, { prompt: string; r2Key: string }> = {}

    if (layerSelections.length > 0) {
      // ── Dynamic path: layer selections from template configurator ──

      // Helper: stage an R2 image at a public URL for Templated.io to fetch, then clean up after render
      async function stageForTemplated(imgR2Key: string, contentType: string): Promise<string> {
        if (publicBaseUrl) {
          const tmpKey = `tmp-${crypto.randomUUID()}.${mimeToExt(contentType)}`
          const obj = await r2.get(imgR2Key)
          if (!obj) throw new Error(`R2 object not found for staging: ${imgR2Key}`)
          await r2.put(tmpKey, await obj.arrayBuffer(), { httpMetadata: { contentType } })
          tmpKeys.push({ key: tmpKey, remote: false })
          const url = `${publicBaseUrl}/api/images/${tmpKey}`
          console.log(`[generate] staged ${imgR2Key} as ${tmpKey}, url=${url}`)
          return url
        } else {
          const obj = await r2.get(imgR2Key)
          if (!obj) throw new Error(`R2 object not found for staging: ${imgR2Key}`)
          const uploadRes = await fetch(`${tempStorageUrl}/api/temp-images`, {
            method: 'POST',
            headers: {
              'Content-Type': contentType,
              'X-Internal-Secret': sessionSecret,
              'X-Filename': imgR2Key,
            },
            body: await obj.arrayBuffer(),
          })
          if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            throw new Error(`Temp upload to ${tempStorageUrl} failed: ${uploadRes.status} — ${errText}`)
          }
          const { key, url } = await uploadRes.json() as { key: string; url: string }
          tmpKeys.push({ key, remote: true })
          console.log(`[generate] local dev: staged ${imgR2Key} as ${key} on ${tempStorageUrl}, url=${url}`)
          return url
        }
      }

      // Load the most recent successful ad's layer image cache for prompt comparison
      type LayerCache = Record<string, { prompt: string; r2Key: string }>
      const [prevAd] = await db
        .select({ layerImageCache: generatedAds.layerImageCache })
        .from(generatedAds)
        .where(and(eq(generatedAds.adConfigId, configId), eq(generatedAds.status, 'complete')))
        .orderBy(desc(generatedAds.createdAt))
        .limit(1)
      const prevCache: LayerCache = JSON.parse(prevAd?.layerImageCache ?? '{}') ?? {}
      newCache = {}

      // Determine which generate-mode layers need a new Fal.ai call vs. can reuse their cached R2 image
      const generateLayers = layerSelections.filter(
        sel => sel.type === 'image' && sel.imageMode !== 'upload' && sel.prompt,
      )

      const cacheChecks = await Promise.all(
        generateLayers.map(async (sel) => {
          const entry = prevCache[sel.layer]
          if (entry?.prompt === sel.prompt && entry.r2Key) {
            const obj = await r2.get(entry.r2Key)
            if (obj) {
              console.log(`[generate] cache HIT layer '${sel.layer}': reusing ${entry.r2Key}`)
              return { sel, hit: true as const, r2Key: entry.r2Key }
            }
          }
          console.log(`[generate] cache MISS layer '${sel.layer}': will call Fal.ai`)
          return { sel, hit: false as const, r2Key: null }
        }),
      )

      const cachedHits = cacheChecks.filter(c => c.hit)
      const toGenerate = cacheChecks.filter(c => !c.hit).map(c => c.sel)

      // Run only the uncached layers through Fal.ai; fetch result bytes and store in R2
      const newGenResults = await Promise.all(
        toGenerate.map(async (sel) => {
          const falUrl = await falSubscribe(falKey, 'fal-ai/flux-2-pro', {
            prompt: sel.prompt,
            image_size: falImageSize,
          })
          const imgRes = await fetch(falUrl)
          if (!imgRes.ok) throw new Error(`Failed to fetch Fal result for layer '${sel.layer}': ${imgRes.status}`)
          const imgBuffer = await imgRes.arrayBuffer()
          const ct = imgRes.headers.get('content-type') || 'image/jpeg'
          const layerKey = `${crypto.randomUUID()}.${mimeToExt(ct)}`
          await r2.put(layerKey, imgBuffer, { httpMetadata: { contentType: ct } })
          console.log(`[generate] Fal.ai layer '${sel.layer}': stored as ${layerKey}`)
          return { layer: sel.layer, prompt: sel.prompt!, r2Key: layerKey }
        }),
      )

      // Populate the new cache with all generate-mode layer images
      for (const c of cachedHits)    newCache[c.sel.layer] = { prompt: c.sel.prompt!, r2Key: c.r2Key! }
      for (const g of newGenResults) newCache[g.layer]     = { prompt: g.prompt,       r2Key: g.r2Key }

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
            if (!r2Object) throw new Error(`Uploaded image not found in R2 for layer '${sel.layer}': ${sel.r2Key}`)
            const contentType = r2Object.httpMetadata?.contentType ?? 'image/png'
            templatedLayers[sel.layer] = { image_url: await stageForTemplated(sel.r2Key, contentType) }
          }
        } else if (sel.type === 'image' && sel.imageMode !== 'upload' && !sel.prompt) {
          console.warn(`[generate] SKIP layer '${sel.layer}': generate mode but no prompt saved`)
        }
      }

      // Stage all generate-mode layer images (cached + newly generated) for Templated.io
      for (const { layer, r2Key: imgKey } of [
        ...cachedHits.map(c => ({ layer: c.sel.layer, r2Key: c.r2Key! })),
        ...newGenResults.map(g => ({ layer: g.layer, r2Key: g.r2Key })),
      ]) {
        templatedLayers[layer] = { image_url: await stageForTemplated(imgKey, 'image/jpeg') }
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
      .set({
        status: 'complete',
        r2Key,
        layerImageCache: Object.keys(newCache ?? {}).length > 0 ? JSON.stringify(newCache) : null,
      })
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
