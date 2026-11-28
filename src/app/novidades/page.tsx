import { AppMenu } from '@/components/app-menu'
import { BrandLink } from '@/components/brand-link'
import { Container } from '@/components/container'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { listReleases, type Release } from '@/lib/db'
import { readBackend } from '@cbrl/next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const metadata: Metadata = {
  title: 'Novidades — Imovil',
  description: 'O que chegou de novo no Imovil em cada versão.',
}

async function getReleases(): Promise<Release[]> {
  // Read per request: the build has no database env, so the list must not be
  // baked into the prerendered shell.
  await connection()
  // Database unavailable (env not configured, project paused, stack off) —
  // fall back to empty so the page still renders instead of 500-ing or hanging.
  const result = await readBackend(() => listReleases(30), { label: 'changelog' })
  return result.ok ? result.data : []
}

// Pull only the "## Novidades" section (discarding the technical <details>).
// Falls back to the full body if the release wasn't translated yet.
function extractUserFacing(body: string | null): string {
  if (!body) return ''
  const match = body.match(/^##\s+Novidades\s*\n([\s\S]*?)(?:\n<details>|$)/)
  return match?.[1]?.trim() ?? body
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Read per request, behind Suspense: the header of the page is the static shell.
async function ReleaseList() {
  const releases = await getReleases()
  if (releases.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma versão publicada ainda. Volte em breve 🙂
      </p>
    )
  }
  return (
    <ol className="space-y-20">
      {releases.map((release) => (
        <li key={release.tagName}>
          <header className="mb-4">
            <time
              className="text-muted-foreground text-sm font-medium"
              dateTime={release.publishedAt ?? undefined}
            >
              {formatDate(release.publishedAt)}
            </time>
          </header>
          <div className="prose prose-base dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h3:mt-8 prose-h3:text-xl prose-h3:font-semibold prose-p:leading-relaxed prose-p:text-foreground/85 prose-strong:text-foreground max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {extractUserFacing(release.body)}
            </ReactMarkdown>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function NovidadesPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header>
        <BrandLink className="text-base font-bold tracking-tight md:text-lg">Imovil</BrandLink>
        <AppMenu />
      </Header>
      <Container className="flex-1 px-4 py-12 md:px-6 md:py-20">
        <header className="mx-auto max-w-3xl">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Changelog
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Novidades</h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base md:text-lg">
            Tudo que foi adicionado, melhorado ou corrigido em cada versão do Imovil.
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-3xl">
          <Suspense fallback={null}>
            <ReleaseList />
          </Suspense>

          <p className="text-muted-foreground mt-20 text-sm">
            <Link href={'/'} className="hover:text-foreground underline">
              ← Voltar pro início
            </Link>
          </p>
        </div>
      </Container>
      <Footer />
    </main>
  )
}
