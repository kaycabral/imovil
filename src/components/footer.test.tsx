import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from './footer'

describe('Footer', () => {
  it('shows the current year, read in the browser', () => {
    render(<Footer />)
    expect(screen.getByText(String(new Date().getFullYear()), { exact: false })).toBeVisible()
  })

  it('links to the public pages', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Novidades' })).toHaveAttribute('href', '/novidades')
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
    expect(screen.getByRole('link', { name: 'Termos' })).toHaveAttribute('href', '/termos')
  })
})
