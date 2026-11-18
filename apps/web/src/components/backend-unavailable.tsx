'use client'

import { Button, Card } from '@imovil/design'
import { CloudOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  title?: string
}

export function BackendUnavailable({ title = 'Não conseguimos carregar os imóveis agora' }: Props) {
  const router = useRouter()

  return (
    <Card
      role="status"
      className="mt-10 flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center"
    >
      <CloudOff className="text-muted-foreground mb-4 size-9" aria-hidden strokeWidth={1.6} />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-[40ch] text-sm">
        Nosso servidor está fora do ar ou lento. Tenta de novo em alguns instantes.
      </p>
      <Button variant="link" className="text-primary mt-3" onClick={() => router.refresh()}>
        Tentar de novo
      </Button>
    </Card>
  )
}
