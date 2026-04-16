import { requireSession } from '~/server/utils/auth'

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

async function callGemini(apiKey: string, model: string, body: object): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini responded ${res.status}`)
  return res.json() as Promise<GeminiResponse>
}

async function callWithFallback(
  apiKey: string,
  resolvedModel: string,
  body: object,
): Promise<{ data: GeminiResponse; model: string }> {
  const candidates = resolvedModel ? [resolvedModel, ...FALLBACK_CHAIN] : FALLBACK_CHAIN
  for (const model of candidates) {
    try {
      const data = await callGemini(apiKey, model, body)
      return { data, model }
    } catch {
      // try next candidate
    }
  }
  throw createError({ statusCode: 502, message: 'All Gemini models failed' })
}

function extractText(data: GeminiResponse): string {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const config = useRuntimeConfig(event)
  const apiKey = config.geminiApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 400, message: 'Gemini API key not configured' })
  }

  const body = await readBody<{
    mode?: string
    templateName?: string
    fields?: Array<{ name: string; value: string; type?: string }>
    brief?: string
    fieldName?: string
    currentValue?: string
    instruction?: string
  }>(event)

  const mode = body?.mode
  if (mode !== 'single' && mode !== 'all') {
    throw createError({ statusCode: 400, message: 'mode must be "single" or "all"' })
  }

  const templateName = body?.templateName?.trim() ?? ''
  const fields = body?.fields ?? []
  const brief = body?.brief?.trim() ?? ''

  const resolvedModel = await resolveFlashModel(apiKey)

  if (mode === 'single') {
    const fieldName = body?.fieldName?.trim() ?? ''
    const currentValue = body?.currentValue?.trim() ?? ''
    const instruction = body?.instruction?.trim() ?? ''

    if (!fieldName) throw createError({ statusCode: 400, message: 'fieldName is required' })

    const contextLines = fields
      .filter((f) => f.name !== fieldName)
      .map((f) => `${f.name}: "${f.value}"`)
      .join('\n')

    const userPrompt = [
      `You are a professional ad copywriter. The user is editing an advertisement.`,
      ``,
      templateName ? `Template: "${templateName}"` : '',
      brief ? `Copy brief: ${brief}` : '',
      ``,
      contextLines ? `Other fields in this ad:\n${contextLines}` : '',
      ``,
      `The user wants to rewrite the field "${fieldName}" which currently says: "${currentValue}"`,
      instruction ? `User instruction: "${instruction}"` : '',
      ``,
      `Write a single concise replacement for the "${fieldName}" field that fits coherently with the other fields.`,
      `Output ONLY the replacement text with no explanations or surrounding quotes.`,
    ]
      .filter((l) => l !== null)
      .join('\n')
      .trim()

    const geminiBody = {
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.8, topP: 0.95 },
    }

    const { data, model } = await callWithFallback(apiKey, resolvedModel, geminiBody)
    const suggestion = extractText(data)
    if (!suggestion) throw createError({ statusCode: 502, message: 'Empty response from Gemini' })

    return { suggestion, model }
  }

  // mode === 'all'
  if (!fields.length) throw createError({ statusCode: 400, message: 'fields array is required' })

  // Explicitly skip image layers — only generate text copy
  const textFields = fields.filter((f) => f.type !== 'image')
  if (!textFields.length) throw createError({ statusCode: 400, message: 'No text fields to generate copy for' })

  const fieldList = textFields.map((f) => `- ${f.name}`).join('\n')

  const userPrompt = [
    `You are a professional ad copywriter creating copy for an advertisement.`,
    ``,
    templateName ? `Template: "${templateName}"` : '',
    brief ? `Copy brief: ${brief}` : '',
    ``,
    `Write compelling, concise ad copy for each of these fields. The copy must be cohesive and work together as a single ad.`,
    ``,
    `Fields to fill:`,
    fieldList,
    ``,
    `Output ONLY a JSON object in this exact format with no other text or markdown:`,
    `{"suggestions":[{"name":"field1","value":"copy here"},{"name":"field2","value":"copy here"}]}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
    .trim()

  const geminiBody = {
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.8, topP: 0.95 },
  }

  const { data, model } = await callWithFallback(apiKey, resolvedModel, geminiBody)
  const rawText = extractText(data)
  if (!rawText) throw createError({ statusCode: 502, message: 'Empty response from Gemini' })

  let suggestions: Array<{ name: string; value: string }> = []
  try {
    const parsed = JSON.parse(stripMarkdownFences(rawText)) as {
      suggestions?: Array<{ name: string; value: string }>
    }
    suggestions = parsed.suggestions ?? []
  } catch {
    throw createError({ statusCode: 502, message: 'Gemini returned invalid JSON' })
  }

  return { suggestions, model }
})
