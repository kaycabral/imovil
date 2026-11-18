'use client'

import { setPropertyStatus } from '@/app/actions/properties'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@imovil/design'
import type { PropertyStatus } from '@imovil/shared'
import { MoreHorizontal } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function PropertyStatusMenu({
  id,
  status,
  slug,
}: {
  id: string
  status: PropertyStatus
  slug: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function changeStatus(next: PropertyStatus) {
    if (next === status) return
    startTransition(async () => {
      const result = await setPropertyStatus(id, next)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const successMessage = (() => {
        if (next === 'published') return 'Imóvel publicado.'
        if (next === 'paused') return 'Imóvel pausado.'
        return 'Imóvel voltou para rascunho.'
      })()
      toast.success(successMessage)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          disabled={pending}
          aria-label="Ações do imóvel"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {status !== 'published' && (
          <DropdownMenuItem onSelect={() => changeStatus('published')}>Publicar</DropdownMenuItem>
        )}
        {status === 'published' && (
          <DropdownMenuItem onSelect={() => changeStatus('paused')}>Pausar</DropdownMenuItem>
        )}
        {status === 'paused' && (
          <DropdownMenuItem onSelect={() => changeStatus('draft')}>
            Voltar para rascunho
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/painel/imoveis/${id}/editar` as Route}>Editar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/imoveis/${slug}`} target="_blank" rel="noreferrer">
            Ver anúncio ↗
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
