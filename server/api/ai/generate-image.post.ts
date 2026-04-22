import { uploadedImages } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'
import { mimeToExt, useR2 } from '~/server/utils/r2'

// ── Gemini image model resolution ─────────────────────────────────────────────

const FALLBACK_IMAGE_MODEL = 'models/gemini-2.0-flash-exp-image-generation'

interface GeminiModelEntry {
  name?: string
  supportedGenerationMethods?: string[]
}

async function resolveImageModel(apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (!res.ok) return ''
    const data = (await res.json()) as { models?: GeminiModelEntry[] }
    const models = data.models ?? []
    const imageModels = models
      .filter(
        (m) =>
          (m.supportedGenerationMethods ?? []).includes('generateContent') &&
          (m.name ?? '').toLowerCase().includes('image'),
      )
      .map((m) => m.name ?? '')
      .sort()
      .reverse()
    return imageModels[0] ?? ''
  } catch {
    return ''
  }
}

// ── Base64 helper ──────────────────────────────────────────────────────────────

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ── Fal.ai queue helper ────────────────────────────────────────────────────────

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
  const { request_id } = (await submitRes.json()) as { request_id: string }

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, 3000))
    const statusRes = await fetch(
      `https://queue.fal.run/${model}/requests/${request_id}/status`,
      { headers: { Authorization: `Key ${falKey}` } },
    )
    const status = (await statusRes.json()) as { status: string }
    if (status.status === 'COMPLETED') break
    if (status.status === 'FAILED') throw new Error(`Fal job failed: ${request_id}`)
  }

  const resultRes = await fetch(
    `https://queue.fal.run/${model}/requests/${request_id}`,
    { headers: { Authorization: `Key ${falKey}` } },
  )
  if (!resultRes.ok) throw new Error(`Fal result fetch error: ${resultRes.status}`)
  const result = (await resultRes.json()) as { images: Array<{ url: string }> }
  const url = result.images[0]?.url
  if (!url) throw new Error(`Fal returned no image for request ${request_id}`)
  return url
}

// ── Gemini response type ───────────────────────────────────────────────────────

interface GeminiImageResponse {
  candidates?: {
    content?: {
      parts?: Array<{
        inlineData?: { mimeType: string; data: string }
      }>
    }
  }[]
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const cfg = useRuntimeConfig(event)

  const body = await readBody<{
    prompt?: string
    provider?: string
    projectId?: number
  }>(event)

  const prompt = body?.prompt?.trim()
  const provider = body?.provider === 'fal' ? 'fal' : 'gemini'
  const projectId = body?.projectId ?? null

  if (!prompt) throw createError({ statusCode: 400, message: 'prompt is required' })

  let resultBuffer: ArrayBuffer
  let resultMime = 'image/jpeg'

  if (provider === 'gemini') {
    const apiKey = cfg.geminiApiKey as string
    if (!apiKey) throw createError({ statusCode: 400, message: 'Gemini API key not configured' })

    const resolvedModel = await resolveImageModel(apiKey)
    const model = resolvedModel || FALLBACK_IMAGE_MODEL

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    )
    if (!res.ok) {
      const errText = await res.text()
      throw createError({ statusCode: 502, message: `Gemini error: ${res.status} — ${errText}` })
    }

    const data = (await res.json()) as GeminiImageResponse
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    if (!imagePart?.inlineData) {
      throw createError({ statusCode: 502, message: 'Gemini returned no image' })
    }

    resultMime = imagePart.inlineData.mimeType || 'image/jpeg'
    resultBuffer = base64ToArrayBuffer(imagePart.inlineData.data)
  } else {
    const falKey = cfg.falKey as string
    if (!falKey) throw createError({ statusCode: 400, message: 'Fal.ai API key not configured' })

    const resultUrl = await falSubscribe(falKey, 'fal-ai/flux-2-pro', {
      prompt,
      image_size: { width: 1024, height: 1024 },
    })

    const imgRes = await fetch(resultUrl)
    if (!imgRes.ok) throw new Error(`Failed to fetch Fal result: ${imgRes.status}`)
    resultBuffer = await imgRes.arrayBuffer()
    resultMime = imgRes.headers.get('content-type') || 'image/jpeg'
  }

  const ext = mimeToExt(resultMime)
  const newR2Key = `${crypto.randomUUID()}.${ext}`
  const r2 = useR2(event)
  await r2.put(newR2Key, resultBuffer, { httpMetadata: { contentType: resultMime } })

  const dateStr = new Date().toISOString().slice(0, 10)
  const db = useDb(event)
  const [record] = await db
    .insert(uploadedImages)
    .values({
      projectId: projectId ?? null,
      r2Key: newR2Key,
      filename: `AI Generated – ${dateStr}.${ext}`,
      mimeType: resultMime,
    })
    .returning()

  if (!record) throw createError({ statusCode: 500, message: 'Failed to save generated image' })

  return { r2Key: newR2Key, url: `/api/images/${newR2Key}` }
})
