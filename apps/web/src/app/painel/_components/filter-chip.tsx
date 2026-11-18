import { Button } from '@cbrl/design'
import Link from 'next/link'

export function FilterChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-5 py-2 md:mx-0 md:flex-wrap md:px-0 md:py-0 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  )
}

type FilterChipProps = {
  href: string
  active?: boolean
  children: React.ReactNode
}

export function FilterChip({ href, active, children }: FilterChipProps) {
  return (
    <Button
      asChild
      type="button"
      variant="outline"
      className={`shrink-0 ${
        active
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          : 'hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Link href={href as never} scroll={false}>
        {children}
      </Link>
    </Button>
  )
}
