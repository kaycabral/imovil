import { Footer } from '@/components/footer'
import { getServerUser } from '@/lib/auth/server'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { Topbar } from './_components/topbar'

export const metadata: Metadata = {
  title: 'Painel do corretor — Imovil',
}

// The topbar and footer are the static shell. The session check and every
// panel page (all per user) stream in behind Suspense.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <Suspense fallback={null}>
            <SignedIn>{children}</SignedIn>
          </Suspense>
        </div>
        <Footer />
      </div>
    </div>
  )
}

async function SignedIn({ children }: { children: React.ReactNode }) {
  // Everything below is per request (session): say so before the backend reads.
  await connection()
  const user = await getServerUser()
  if (!user) {
    const next = (await headers()).get('x-pathname') ?? '/painel'
    redirect(`/imoveis?login=1&next=${encodeURIComponent(next)}`)
  }
  return children
}
