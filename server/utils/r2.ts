import type { H3Event } from 'h3'

export interface AppR2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>
  delete(key: string): Promise<void>
}

export function useR2(event: H3Event): AppR2Bucket {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r2 = (event.context.cloudflare?.env as any)?.adgen_images
  if (!r2) {
    throw createError({ statusCode: 500, message: 'R2 binding adgen_images not available' })
  }
  return r2 as AppR2Bucket
}

export function mimeToExt(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType === 'image/svg+xml') return 'svg'
  return 'jpg'
}
