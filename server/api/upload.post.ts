import { mimeToExt, useR2 } from '~/server/utils/r2'
import { uploadedImages } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file')
  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const projectIdRaw = parts?.find(p => p.name === 'projectId')?.data?.toString()
  const projectId = projectIdRaw ? Number(projectIdRaw) : null

  if (projectId) {
    await requireProjectAccess(event, projectId)
  } else if (session.role !== 'admin') {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const mimeType = filePart.type ?? 'image/jpeg'

  const allowed = ['image/png', 'image/gif', 'image/jpeg', 'image/svg+xml']
  if (!allowed.includes(mimeType)) {
    throw createError({ statusCode: 415, message: 'Only PNG, GIF, JPEG, and SVG images are supported' })
  }

  const ext = mimeToExt(mimeType)
  const r2Key = `${crypto.randomUUID()}.${ext}`
  const filename = filePart.filename ?? `upload.${ext}`

  const r2 = useR2(event)
  const buf = filePart.data
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  await r2.put(r2Key, arrayBuf, { httpMetadata: { contentType: mimeType } })

  const db = useDb(event)
  const [record] = await db
    .insert(uploadedImages)
    .values({ projectId, r2Key, filename, mimeType, createdAt: new Date() })
    .returning()

  return record
})
