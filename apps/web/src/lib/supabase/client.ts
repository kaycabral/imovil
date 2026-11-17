import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabasePublicConfig } from './config'

/**
 * Browser Supabase client (Auth + Storage). `createBrowserClient` is a
 * singleton, so calling this per render is cheap. Null when Supabase is not
 * configured — callers fall back to the signed-out UI.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = supabasePublicConfig()
  return config ? createBrowserClient(config.url, config.key) : null
}
