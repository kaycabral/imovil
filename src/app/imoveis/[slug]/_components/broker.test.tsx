import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Broker } from './broker'

const base = {
  name: 'Juliana Prado',
  role: 'Corretora responsável',
  creci: 'CRECI-AM 4.340-F',
  whatsappUrl: 'https://wa.me/5592984220188?text=Ol%C3%A1',
  avatar: 'https://images.unsplash.com/photo-xyz',
}

describe('Broker', () => {
  it('renders name, role and creci', () => {
    render(<Broker {...base} />)
    expect(screen.getByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByText('Corretora responsável')).toBeInTheDocument()
    expect(screen.getByText('CRECI-AM 4.340-F')).toBeInTheDocument()
  })

  it('links the WhatsApp CTA to the broker chat in a new tab', () => {
    render(<Broker {...base} />)
    const wa = screen.getByRole('link', { name: /falar no whatsapp/i })
    expect(wa).toHaveAttribute('href', base.whatsappUrl)
    expect(wa).toHaveAttribute('target', '_blank')
    expect(wa.getAttribute('rel')).toContain('noreferrer')
  })

  it('shows initials when there is no avatar', () => {
    render(<Broker {...base} avatar={null} />)
    expect(screen.getByText('JP')).toBeInTheDocument()
  })
})
