import { Container } from '@/components/container'
import { Card, CardContent, Skeleton } from '@imovil/design'
import { PageHeaderSkeleton } from '../_components/page-header-skeleton'

// Perfil: card de identidade (avatar + nome/email) + card de contato (2 inputs + botão).
export default function ProfileLoading() {
  return (
    <Container className="p-5 md:p-8">
      <PageHeaderSkeleton titleWidth="w-20" descriptionWidth="w-80" />

      <div className="flex flex-col gap-6">
        <Card className="rounded-2xl p-0 shadow-none">
          <CardContent className="flex items-center gap-4 p-5 md:p-6">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-56 max-w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl p-0 shadow-none">
          <CardContent className="flex flex-col gap-4 p-5 md:p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />

            <div className="grid gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            <div className="grid gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            <div className="flex justify-end">
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
