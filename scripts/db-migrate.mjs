#!/usr/bin/env node

// Idempotent migrations runner for D1 (local or remote).
// - Runs 0000_pretty_blink.sql once (baseline, tracked like all others).
// - Runs each additional migration file in order, exactly once, tracked in __drizzle_migrations.
// - Uses migrations dir relative to this script so it works regardless of cwd.
// - Handles both JSON response shapes from wrangler (object or array of results).
//
// To add a new DB change:
// 1. Create drizzle/migrations/NNNN_Short_Description.sql
// 2. Put your DDL then record the run:
//    INSERT INTO __drizzle_migrations (hash, created_at)
//    SELECT 'NNNN_Short_Description', (unixepoch() * 1000)
//    WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = 'NNNN_Short_Description');
// 3. Run: npm run db:migrate (local) and npm run db:migrate:remote (remote)

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATABASE_NAME = 'adgen-db'
const MIGRATIONS_DIR = join(__dirname, '..', 'drizzle', 'migrations')
const BASELINE = '0000_pretty_blink.sql'

const argv = process.argv.slice(2)
const isRemote = argv.includes('--remote')
const locationFlag = isRemote ? '--remote' : '--local'
const locationLabel = isRemote ? 'remote' : 'local'

function runJson(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DATABASE_NAME, locationFlag, '--command', sql, '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
  return JSON.parse(out)
}

// Wrangler can return { results } or [{ results }]; normalize to a rows array.
function getQueryRows(res) {
  const first = Array.isArray(res) ? res[0] : res
  const results = first?.results
  return Array.isArray(results) ? results : []
}

function runFile(filePath) {
  execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DATABASE_NAME, locationFlag, '--file', filePath, '--yes'],
    { stdio: 'inherit' },
  )
}

// Load all applied migration hashes in a single wrangler call.
// Returns an empty Set if the tracking table doesn't exist yet (fresh DB).
function loadAppliedHashes() {
  try {
    const res = runJson(`SELECT hash FROM __drizzle_migrations`)
    const rows = getQueryRows(res)
    return new Set(rows.map((r) => r?.hash).filter(Boolean))
  } catch (_) {
    return new Set()
  }
}

console.log(`[db-migrate] Target: ${locationLabel} (${MIGRATIONS_DIR})`)

// --- Load all applied hashes once (1 wrangler call) ---
const appliedHashes = loadAppliedHashes()

// 1) Baseline: run initial schema if not yet applied
const baselineHash = BASELINE.replace(/\.sql$/i, '')
const baselinePath = join(MIGRATIONS_DIR, BASELINE)
if (appliedHashes.has(baselineHash)) {
  console.log(`[db-migrate] Skip (already applied): ${BASELINE}`)
} else {
  console.log(`[db-migrate] Applying: ${BASELINE}`)
  try {
    runFile(baselinePath)
    appliedHashes.add(baselineHash)
  } catch (e) {
    console.error('[db-migrate] Baseline migration failed:', e?.message ?? e)
    process.exit(1)
  }
}

// 2) Incremental: run each migration file in order, once
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql') && f !== BASELINE)
  .sort()

for (const file of files) {
  const hash = file.replace(/\.sql$/i, '')
  if (appliedHashes.has(hash)) {
    console.log(`[db-migrate] Skip (already applied): ${file}`)
    continue
  }
  console.log(`[db-migrate] Applying: ${file}`)
  const filePath = join(MIGRATIONS_DIR, file)
  try {
    runFile(filePath)
    appliedHashes.add(hash)
  } catch (e) {
    console.error(`[db-migrate] Failed to apply ${file}:`, e?.message ?? e)
    process.exit(1)
  }
}

// 3) Verify: spot-check that baseline tables exist
function verify() {
  try {
    const expected = ['0000_pretty_blink']
    const missing = expected.filter((h) => !appliedHashes.has(h))
    if (missing.length > 0) {
      console.error(`[db-migrate] Missing migrations (${locationLabel}): ${missing.join(', ')}`)
      process.exit(1)
    }

    const schemaRes = runJson(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('ad_configs','generated_ads')`,
    )
    const rows = getQueryRows(schemaRes)
    const tableNames = rows.map((r) => r.name)

    if (!tableNames.includes('ad_configs')) {
      console.error('[db-migrate] Verification failed: ad_configs table missing')
      process.exit(1)
    }
    if (!tableNames.includes('generated_ads')) {
      console.error('[db-migrate] Verification failed: generated_ads table missing')
      process.exit(1)
    }

    console.log(`[db-migrate] Verified (${locationLabel}): all migrations applied, tables present`)
  } catch (e) {
    console.error('[db-migrate] Verification failed:', e?.message ?? e)
    process.exit(1)
  }
}

verify()
