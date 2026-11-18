import { Container } from '@/components/container'
import { Card, CardContent, Skeleton } from '@imovil/design'
import { PageHeaderSkeleton } from './_components/page-header-skeleton'

// Visão geral: 4 métricas + 4 cards de imóveis + lista de leads.
export default function DashboardOverviewLoading() {
  return (
    <Container className="p-5 md:p-8">
      <PageHeaderSkeleton titleWidth="w-48" descriptionWidth="w-72" />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-2xl p-0 shadow-none">
                <Skeleton className="aspect-[5/3] w-full rounded-none" />
                <CardContent className="p-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="mt-1 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Card className="overflow-hidden rounded-2xl p-0">
            <ul className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-start gap-3 p-4">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </Container>
  )
}

function MetricCardSkeleton() {
  // Espelha MetricCard: p-5 + label text-xs + value text-3xl + trend/hint text-xs
  return (
    <Card className="rounded-2xl shadow-none">
      <CardContent className="p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-16" />
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
