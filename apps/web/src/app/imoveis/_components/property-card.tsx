import { formatBRLFromCents } from '@/lib/money'
import { Badge } from '@cbrl/design'
import { propertyKindLabels, type Property } from '@tekoa/shared'
import Image from 'next/image'
import Link from 'next/link'

export function PropertyCard({ p, priority = false }: { p: Property; priority?: boolean }) {
  const cover = p.images[0]
  const isRental = p.deal === 'rental'
  const total = p.price + p.condo + p.iptu
  const hasBadges = p.petFriendly || p.furnished

  return (
    <Link
      href={{ pathname: '/imoveis/[slug]', query: {} }}
      as={`/imoveis/${p.slug}`}
      className="group focus-visible:ring-primary/50 flex h-full flex-col rounded-xl focus:outline-none focus-visible:ring-2"
      aria-label={p.title}
    >
      <figure className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
        {cover && (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        )}
        <Badge className="bg-background/90 text-foreground absolute top-3 left-3 backdrop-blur-sm">
          {propertyKindLabels[p.kind]}
        </Badge>
      </figure>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">
            {p.neighborhood}, {p.city}
          </p>
          <h3 className="group-hover:text-primary mt-0.5 line-clamp-2 text-[0.95rem] leading-snug font-semibold tracking-tight transition-colors">
            {p.title}
          </h3>
        </div>
      </div>

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="tabular-nums">{p.area} m²</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">
          {p.rooms} {p.rooms === 1 ? 'quarto' : 'quartos'}
        </span>
        {p.parking > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {p.parking} {p.parking === 1 ? 'vaga' : 'vagas'}
            </span>
          </>
        )}
        <span aria-hidden>·</span>
        <span className="tabular-nums">
          {p.transitDistanceMin} min de {p.transitLabel.replace(/\s*\(.*\)\s*/, '')}
        </span>
      </div>

      <div className="mt-auto pt-3">
        {hasBadges && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {p.petFriendly && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Aceita pet</Badge>
            )}
            {p.furnished && <Badge variant="secondary">Mobiliado</Badge>}
          </div>
        )}
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="text-base font-bold tabular-nums">{formatBRLFromCents(p.price)}</span>
          {isRental && <span className="text-muted-foreground text-xs">/mês</span>}
          {isRental && (
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              Total {formatBRLFromCents(total)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
