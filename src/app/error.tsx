'use client'

import { Button, Card } from '@cbrl/design'
import { CloudOff } from 'lucide-react'
import Link from 'next/link'

// Safety net for any segment whose backend read is not wrapped in
// `readBackend` (e.g. painel pages after a valid session): render a recoverable
// screen inside the root layout instead of the default crash page. The error
// itself is logged on the server, where it happened.
export default function RouteError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-5">
      <Card
        role="alert"
        className="flex max-w-md flex-col items-center rounded-xl px-6 py-16 text-center"
      >
        <CloudOff className="text-muted-foreground mb-4 size-9" aria-hidden strokeWidth={1.6} />
        <h1 className="text-lg font-semibold tracking-tight">Algo deu errado por aqui</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Não conseguimos carregar esta página agora. Tenta de novo em alguns instantes.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => unstable_retry()}>Tentar de novo</Button>
          <Button asChild variant="outline">
            <Link href="/imoveis">Ver imóveis</Link>
          </Button>
        </div>
      </Card>
    </main>
  )
}
