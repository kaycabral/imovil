import type { Property } from '@imovil/shared'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PropertyCard } from './property-card'

const base: Property = {
  id: 'abc123',
  slug: 'apto-test',
  ownerId: 'uid-1',
  status: 'published',
  kind: 'apartment',
  deal: 'rental',
  title: 'Apartamento de teste',
  subtitle: 'Teste',
  postalCode: '69057070',
  street: 'Rua Teste',
  neighborhood: 'Adrianópolis',
  city: 'Manaus',
  state: 'AM',
  coords: null,
  price: 280000,
  condo: 45000,
  iptu: 8500,
  area: 58,
  rooms: 2,
  suites: 0,
  parking: 1,
  petFriendly: true,
  furnished: false,
  transitDistanceMin: 10,
  transitLabel: 'Av. Djalma Batista (linha executiva)',
  builtYear: 1998,
  description: ['Descrição'],
  details: [],
  images: [{ path: 'p/1', src: 'https://images.unsplash.com/photo-1', alt: 'capa' }],
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

describe('PropertyCard', () => {
  it('renders neighborhood, city, and title', () => {
    render(<PropertyCard p={base} />)
    expect(screen.getByText(/Adrianópolis, Manaus/)).toBeInTheDocument()
    expect(screen.getByText('Apartamento de teste')).toBeInTheDocument()
  })

  it('shows kind badge, rent, and total cost', () => {
    render(<PropertyCard p={base} />)
    expect(screen.getByText('Apartamento')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*2\.800,00/)).toBeInTheDocument()
    // total = 2800 + 450 + 85 = 3335
    expect(screen.getByText(/Total\s*R\$\s*3\.335,00/)).toBeInTheDocument()
  })

  it('shows the pet tag only when petFriendly is true', () => {
    const { rerender } = render(<PropertyCard p={base} />)
    expect(screen.getByText('Aceita pet')).toBeInTheDocument()
    rerender(<PropertyCard p={{ ...base, petFriendly: false }} />)
    expect(screen.queryByText('Aceita pet')).not.toBeInTheDocument()
  })

  it('shows the furnished tag only when furnished is true', () => {
    const { rerender } = render(<PropertyCard p={base} />)
    expect(screen.queryByText('Mobiliado')).not.toBeInTheDocument()
    rerender(<PropertyCard p={{ ...base, furnished: true }} />)
    expect(screen.getByText('Mobiliado')).toBeInTheDocument()
  })

  it('strips the parenthetical qualifier from the transit label', () => {
    render(<PropertyCard p={base} />)
    expect(screen.getByText(/10 min de Av\. Djalma Batista/)).toBeInTheDocument()
    expect(screen.queryByText(/linha executiva/)).not.toBeInTheDocument()
  })

  it('links to the property detail page', () => {
    render(<PropertyCard p={base} />)
    const link = screen.getByRole('link', { name: base.title })
    expect(link.getAttribute('href')).toBe('/imoveis/apto-test')
  })

  it('singularizes the label for a single vaga', () => {
    render(<PropertyCard p={base} />)
    expect(screen.getByText('1 vaga')).toBeInTheDocument()
  })

  it('pluralizes rooms when more than one', () => {
    render(<PropertyCard p={base} />)
    expect(screen.getByText('2 quartos')).toBeInTheDocument()
  })

  it('hides parking info when there is no vaga', () => {
    render(<PropertyCard p={{ ...base, parking: 0 }} />)
    expect(screen.queryByText(/vaga/)).not.toBeInTheDocument()
  })
})
