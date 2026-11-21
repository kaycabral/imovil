import { PageHeaderSkeleton } from '@/app/painel/_components/page-header-skeleton'
import { Container } from '@/components/container'
import { Card, CardContent, Skeleton } from '@cbrl/design'

// Novo imóvel: 5 sections empilhadas (Anúncio, Localização, Valores, Características, Imagens).
export default function NewPropertyLoading() {
  return (
    <Container className="p-5 md:p-8">
      <PageHeaderSkeleton titleWidth="w-40" descriptionWidth="w-80" />

      <div className="flex flex-col gap-6">
        {/* Anúncio: 2 selects lado a lado + título full + subtítulo + descrição */}
        <FormSectionSkeleton titleWidth="w-24">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)]">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton inputHeight="h-32" />
        </FormSectionSkeleton>

        {/* Localização: CEP 240px + card de endereço */}
        <FormSectionSkeleton titleWidth="w-28">
          <FieldSkeleton inputWidth="md:max-w-[240px]" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_minmax(0,220px)]">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </FormSectionSkeleton>

        {/* Valores e detalhes: 9 inputs numéricos em grid 2/3 cols */}
        <FormSectionSkeleton titleWidth="w-40">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
        </FormSectionSkeleton>

        {/* Características: 2 switches */}
        <FormSectionSkeleton titleWidth="w-32">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </FormSectionSkeleton>

        {/* Imagens: empty-state uploader */}
        <FormSectionSkeleton titleWidth="w-20">
          <Skeleton className="h-28 w-full rounded-xl" />
        </FormSectionSkeleton>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-9 w-36 rounded-md" />
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-44 rounded-md" />
          </div>
        </div>
      </div>
    </Container>
  )
}

function FormSectionSkeleton({
  titleWidth,
  children,
}: {
  titleWidth: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl p-0 shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 md:p-6">
        <Skeleton className={`h-5 ${titleWidth}`} />
        {children}
      </CardContent>
    </Card>
  )
}

function FieldSkeleton({
  inputHeight = 'h-9',
  inputWidth = '',
}: {
  inputHeight?: string
  inputWidth?: string
}) {
  // FormItem real: FormLabel text-sm (h-4) + gap-2 + Input h-9
  return (
    <div className="grid gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className={`${inputHeight} w-full ${inputWidth} rounded-md`} />
    </div>
  )
}
