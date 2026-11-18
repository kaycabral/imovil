import { Container } from '@/components/container'
import { Card, Skeleton } from '@imovil/design'
import { PageHeaderSkeleton } from '../_components/page-header-skeleton'

// Leads: filtros + lista com avatar + nome + badge + texto + botão WhatsApp.
export default function LeadsLoading() {
  return (
    <Container className="p-5 md:p-8">
      <PageHeaderSkeleton titleWidth="w-24" descriptionWidth="w-80" />

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2 md:mx-0 md:flex-wrap md:px-0 md:py-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <Card className="mt-5 overflow-hidden rounded-2xl p-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-5 md:p-5"
            >
              <div className="flex items-start gap-3 md:flex-1">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-64 max-w-full" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-md md:shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </Container>
  )
}
