import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import * as schema from './schema'

export function useDb(event: H3Event) {
  const { cloudflare } = event.context
  const d1 = cloudflare?.env?.adgen_db
  if (!d1) {
    throw new Error('D1 binding adgen_db not available')
  }
  return drizzle(d1, { schema })
}

export type Db = ReturnType<typeof useDb>
