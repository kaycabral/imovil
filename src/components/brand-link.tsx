'use client'

import { cn } from '@cbrl/design'
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from './brand-mark'

type BrandLinkProps = {
  href?: Route
  className?: string
  children: React.ReactNode
}

export function BrandLink({ href = '/imoveis', className, children }: BrandLinkProps) {
  const pathname = usePathname()
  const isHere = pathname === href

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
