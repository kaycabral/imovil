import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RouteError from './error'

describe('RouteError', () => {
  it('retries the segment on demand', async () => {
    const retry = vi.fn()
    const error = new Error('database down')

    render(<RouteError error={error} unstable_retry={retry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado por aqui')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Ver imóveis' })).toHaveAttribute('href', '/imoveis')
  })
})
