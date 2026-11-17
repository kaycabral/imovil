import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Broker } from './broker'

const base = {
  name: 'Juliana Prado',
  role: 'Corretora responsável',
  creci: 'CRECI-AM 4.340-F',
  phone: '+55 92 98422-0188',
  whatsappText: 'Olá Juliana, vi o imóvel pelo Imovil.',
  avatar: 'https://images.unsplash.com/photo-xyz',
}

describe('Broker', () => {
  it('renders name, role and creci', () => {
    render(<Broker {...base} />)
    expect(screen.getByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByText('Corretora responsável')).toBeInTheDocument()
    expect(screen.getByText('CRECI-AM 4.340-F')).toBeInTheDocument()
  })

  it('builds a wa.me URL from the phone digits, regardless of formatting', () => {
    render(<Broker {...base} />)
    const wa = screen.getByRole('link', { name: /falar no whatsapp/i })
    const href = wa.getAttribute('href')!
    expect(href.startsWith('https://wa.me/5592984220188?text=')).toBe(true)
  })

  it('URL-encodes the whatsapp message', () => {
    render(<Broker {...base} />)
    const wa = screen.getByRole('link', { name: /falar no whatsapp/i })
    const href = wa.getAttribute('href')!
    expect(href).toContain(encodeURIComponent(base.whatsappText))
  })

  it('opens WhatsApp in a new tab', () => {
    render(<Broker {...base} />)
    const wa = screen.getByRole('link', { name: /falar no whatsapp/i })
    expect(wa.getAttribute('target')).toBe('_blank')
    expect(wa.getAttribute('rel')).toContain('noreferrer')
  })

  it('does not render a tel: link (contact is WhatsApp-only)', () => {
    render(<Broker {...base} />)
    expect(screen.queryByRole('link', { name: /\+55 92 98422-0188/ })).not.toBeInTheDocument()
  })

  it('strips arbitrary formatting from the phone for URLs', () => {
    render(<Broker {...base} phone="(92) 9.8422-0188" />)
    const wa = screen.getByRole('link', { name: /falar no whatsapp/i })
    expect(wa.getAttribute('href')!.startsWith('https://wa.me/92984220188?')).toBe(true)
  })
})
