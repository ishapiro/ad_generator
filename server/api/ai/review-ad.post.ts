import { requireSession } from '~/server/utils/auth'
import { useR2 } from '~/server/utils/r2'

const FALLBACK_CHAIN = ['models/gemini-2.5-flash-preview', 'models/gemini-2.5-flash-latest']
const EXCLUDE_PATTERNS = ['image', 'audio', 'tts', 'live', 'native']

interface GeminiModelEntry {
  name?: string
  supportedGenerationMethods?: string[]
}

async function resolveFlashModel(apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (!res.ok) return ''
    const data = (await res.json()) as { models?: GeminiModelEntry[] }
    const models = data.models ?? []
    const flashModels = models
      .filter(
        (m) =>
          (m.supportedGenerationMethods ?? []).includes('generateContent') &&
          (m.name ?? '').toLowerCase().includes('flash') &&
          !EXCLUDE_PATTERNS.some((p) => (m.name ?? '').toLowerCase().includes(p)),
      )
      .map((m) => m.name ?? '')
      .sort()
      .reverse()
    return flashModels[0] ?? ''
  } catch {
    return ''
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

function extractText(data: GeminiResponse): string {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const cfg = useRuntimeConfig(event)
  const apiKey = cfg.geminiApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 400, message: 'Gemini API key not configured' })
  }

  const body = await readBody<{ r2Key?: string; prompt?: string }>(event)
  const r2Key = body?.r2Key?.trim()
  const prompt = body?.prompt?.trim()
  if (!r2Key) throw createError({ statusCode: 400, message: 'r2Key is required' })
  if (!prompt) throw createError({ statusCode: 400, message: 'prompt is required' })

  // Fetch the generated ad image from R2
  const r2 = useR2(event)
  const r2Object = await r2.get(r2Key)
  if (!r2Object) throw createError({ statusCode: 404, message: 'Generated ad image not found' })

  const imageBuffer = await r2Object.arrayBuffer()
  const mimeType = r2Object.httpMetadata?.contentType ?? 'image/jpeg'
  const base64Image = arrayBufferToBase64(imageBuffer)

  const resolvedModel = await resolveFlashModel(apiKey)
  const candidates = resolvedModel ? [resolvedModel, ...FALLBACK_CHAIN] : FALLBACK_CHAIN

  const geminiBody = {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64Image } },
        { text: prompt },
      ],
    }],
    generationConfig: { temperature: 0.7, topP: 0.95 },
  }

  let lastError: Error | null = null
  for (const model of candidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      })
      if (!res.ok) throw new Error(`Gemini responded ${res.status}`)
      const data = await res.json() as GeminiResponse
      const review = extractText(data)
      if (!review) throw new Error('Empty response from Gemini')
      return { review, model }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw createError({ statusCode: 502, message: lastError?.message ?? 'All Gemini models failed' })
})
