import { Skeleton } from '@imovil/design'

/** Dimensões espelham PageHeader real: h1 text-xl md:text-2xl + p text-sm md:text-base */
export function PageHeaderSkeleton({
  titleWidth = 'w-40',
  descriptionWidth = 'w-64',
}: {
  titleWidth?: string
  descriptionWidth?: string
}) {
  return (
    <div className="mb-6 md:mb-8">
      <Skeleton className={`h-6 md:h-7 ${titleWidth}`} />
      <Skeleton className={`mt-1 h-4 md:h-5 ${descriptionWidth}`} />
    </div>
  )
}
