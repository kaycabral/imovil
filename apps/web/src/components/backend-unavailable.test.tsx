import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BackendUnavailable } from './backend-unavailable'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('BackendUnavailable', () => {
  it('renders the default title and retries by refreshing the route', async () => {
    render(<BackendUnavailable />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Não conseguimos carregar os imóveis agora',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('accepts a custom title', () => {
    render(<BackendUnavailable title="Não conseguimos carregar este imóvel agora" />)
    expect(screen.getByRole('status')).toHaveTextContent('este imóvel')
  })
})
