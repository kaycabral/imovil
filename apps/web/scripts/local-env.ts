// Write the LOCAL Supabase stack values into `.env.local` (creating it from
// `.env.example` when missing), keeping every other line untouched. Run after
// `pnpm db:start`: `pnpm db:env`.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { imovilAppDir, readLocalSupabase } from '../e2e/local-supabase'

const appDir = imovilAppDir()
const target = path.join(appDir, '.env.local')
const source = existsSync(target) ? target : path.join(appDir, '.env.example')

const local = readLocalSupabase()
const values: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
  POSTGRES_URL: local.dbUrl,
}

const lines = readFileSync(source, 'utf8').split('\n')
const seen = new Set<string>()
const updated = lines.map((line) => {
  const key = line.split('=', 1)[0]?.trim() ?? ''
  if (key in values) {
    seen.add(key)
    return `${key}=${values[key]}`
  }
  return line
})
for (const [key, value] of Object.entries(values)) {
  if (!seen.has(key)) updated.push(`${key}=${value}`)
}
writeFileSync(target, updated.join('\n'))
console.log(`Local Supabase values written to ${path.relative(appDir, target)}`)
