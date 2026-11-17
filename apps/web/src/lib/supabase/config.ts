export type SupabasePublicConfig = {
  url: string
  key: string
}

/**
 * Public Supabase config (project URL + publishable key), or null when the app
 * runs without a backend — callers then render the signed-out / degraded UI
 * instead of crashing. The env vars are read as literals so Next inlines them
 * into the client bundle.
 */
export function supabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && key ? { url, key } : null
}
