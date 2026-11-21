import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RouteError from './error'

describe('RouteError', () => {
  it('logs the error and retries the segment on demand', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const retry = vi.fn()
    const error = new Error('database down')

    render(<RouteError error={error} unstable_retry={retry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado por aqui')
    expect(consoleError).toHaveBeenCalledWith(error)
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Ver imóveis' })).toHaveAttribute('href', '/imoveis')
    consoleError.mockRestore()
  })
})
