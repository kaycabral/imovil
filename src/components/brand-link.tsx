'use client'

import { cn } from '@cbrl/design'
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { BrandMark } from './brand-mark'

type BrandLinkProps = {
  href?: Route
  className?: string
  children: React.ReactNode
}

// `usePathname()` suspends while the static shell is built for routes with
// unknown params (e.g. `/imoveis/[slug]`). The fallback is the same link
// without the "you are here" state, so the shell still prerenders.
export function BrandLink(props: BrandLinkProps) {
  return (
    <Suspense fallback={<BrandAnchor {...props} isHere={false} />}>
      <CurrentBrandLink {...props} />
    </Suspense>
  )
}

function CurrentBrandLink(props: BrandLinkProps) {
  const pathname = usePathname()
  return <BrandAnchor {...props} isHere={pathname === (props.href ?? '/imoveis')} />
}

function BrandAnchor({
  href = '/imoveis',
  className,
  children,
  isHere,
}: BrandLinkProps & { isHere: boolean }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2', className)}
      aria-current={isHere ? 'page' : undefined}
      onClick={(e) => {
        if (isHere) e.preventDefault()
      }}
    >
      <BrandMark />
      {children}
    </Link>
  )
}
