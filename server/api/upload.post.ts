import { useR2, mimeToExt } from '~/server/utils/r2'
import { uploadedImages } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file')
  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const mimeType = filePart.type ?? 'image/jpeg'
  const ext = mimeToExt(mimeType)
  const r2Key = `uploads/${crypto.randomUUID()}.${ext}`
  const filename = filePart.filename ?? `upload.${ext}`

  const r2 = useR2(event)
  const buf = filePart.data
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  await r2.put(r2Key, arrayBuf, { httpMetadata: { contentType: mimeType } })

  const db = useDb(event)
  const [record] = await db
    .insert(uploadedImages)
    .values({ r2Key, filename, mimeType, createdAt: new Date() })
    .returning()

  return record
})
