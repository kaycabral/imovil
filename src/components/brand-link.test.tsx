import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrandLink } from './brand-link'

let pathname = '/imoveis'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

describe('BrandLink', () => {
  afterEach(() => {
    pathname = '/imoveis'
  })

  it('marks the current page and swallows the click there', () => {
    render(<BrandLink>Imovil</BrandLink>)

    const link = screen.getByRole('link', { name: 'Imovil' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(fireEvent.click(link)).toBe(false)
  })

  it('navigates normally from another page', () => {
    pathname = '/novidades'
    render(<BrandLink href="/imoveis">Imovil</BrandLink>)

    const link = screen.getByRole('link', { name: 'Imovil' })
    expect(link).toHaveAttribute('href', '/imoveis')
    expect(link).not.toHaveAttribute('aria-current')
  })
})
