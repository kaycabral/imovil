'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
      className={className}
      aria-current={isHere ? 'page' : undefined}
      onClick={(e) => {
        if (isHere) e.preventDefault()
      }}
    >
      {children}
    </Link>
  )
}
