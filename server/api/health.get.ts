export default defineEventHandler(async (event) => {
  try {
    const db = event.context.cloudflare?.env?.adgen_db
    if (!db) return { ok: false }
    await db.prepare('SELECT 1').first()
    return { ok: true }
  } catch (e) {
    console.error('Health check failed:', e)
    return { ok: false }
  }
})
