import { getFeatures } from '@/lib/features'
import type { Route } from 'next'
import { Suspense } from 'react'
import { AppMenuClient } from './_app-menu-client'

type Props = {
  primaryCta?: { label: string; href: Route }
}

// Server wrapper. Fetches Remote Config so every page can render the same
// fully-populated menu without plumbing `features` through layouts/pages.
// `getFeatures` is React.cache'd, so additional calls in the same request
// are free.
//
// AppMenuClient calls useGoogleSignIn → useSearchParams. Without a Suspense
// boundary, any statically-generated route that renders the menu (e.g. the
// `/novidades` changelog with revalidate=3600) bails out at prerender with
// "useSearchParams should be wrapped in a suspense boundary". Suspense lets
// the static shell ship and the menu hydrate client-side.
export async function AppMenu({ primaryCta }: Props = {}) {
  const features = await getFeatures()
  return (
    <Suspense fallback={null}>
      <AppMenuClient features={features} primaryCta={primaryCta} />
    </Suspense>
  )
}
