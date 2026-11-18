import { Container } from '@/components/container'
import { Card, CardContent, Skeleton } from '@imovil/design'
import { PageHeaderSkeleton } from '../_components/page-header-skeleton'

// Meus imóveis: filter chips + cards mobile / tabela desktop.
export default function PropertiesListLoading() {
  return (
    <Container className="p-5 md:p-8">
      <PageHeaderSkeleton titleWidth="w-36" descriptionWidth="w-52" />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full rounded-full md:w-36" />
      </div>

      {/* Mobile */}
      <div className="mt-5 grid grid-cols-1 gap-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden rounded-2xl p-0 shadow-none">
            <CardContent className="flex gap-3 p-3">
              <Skeleton className="aspect-[4/3] w-28 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
              <Skeleton className="size-8 shrink-0 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop */}
      <Card className="mt-5 hidden overflow-hidden rounded-2xl p-0 shadow-none lg:block">
        <div className="bg-secondary/50 flex gap-4 px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="divide-border/60 divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-12 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-64 max-w-full" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </Card>
    </Container>
  )
}
