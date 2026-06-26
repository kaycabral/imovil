import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyStatusMenu } from './property-status-menu'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const setPropertyStatus = vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue({ ok: true })
vi.mock('@/app/actions/properties', () => ({
  setPropertyStatus: (...args: unknown[]): unknown => setPropertyStatus(...args),
}))

const toastSuccess = vi.fn<(...args: unknown[]) => void>()
const toastError = vi.fn<(...args: unknown[]) => void>()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]): void => toastSuccess(...args),
    error: (...args: unknown[]): void => toastError(...args),
  },
}))

beforeEach(() => {
  setPropertyStatus.mockClear()
  setPropertyStatus.mockResolvedValue({ ok: true })
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('PropertyStatusMenu', () => {
  it('draft oferece "Publicar"', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="draft" slug="apto-test" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    expect(await screen.findByRole('menuitem', { name: 'Publicar' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Pausar' })).not.toBeInTheDocument()
  })

  it('published oferece "Pausar"', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="published" slug="apto-test" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    expect(await screen.findByRole('menuitem', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Publicar' })).not.toBeInTheDocument()
  })

  it('paused oferece "Publicar" e "Voltar para rascunho"', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="paused" slug="apto-test" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    expect(await screen.findByRole('menuitem', { name: 'Publicar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Voltar para rascunho' })).toBeInTheDocument()
  })

  it('sempre mostra link "Ver anúncio" apontando pro slug', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="draft" slug="apto-xyz" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    const link = await screen.findByRole('menuitem', { name: /Ver anúncio/ })
    expect(link.getAttribute('href')).toBe('/imoveis/apto-xyz')
  })

  it('mostra link "Editar" apontando pro /painel/imoveis/[id]/editar', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p42" status="published" slug="apto-xyz" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    const link = await screen.findByRole('menuitem', { name: 'Editar' })
    expect(link.getAttribute('href')).toBe('/painel/imoveis/p42/editar')
  })

  it('clicar em "Publicar" chama setPropertyStatus com published e mostra toast', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p42" status="draft" slug="x" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Publicar' }))

    await waitFor(() => expect(setPropertyStatus).toHaveBeenCalledWith('p42', 'published'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Imóvel publicado.'))
  })

  it('clicar em "Pausar" chama action com paused', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="published" slug="x" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Pausar' }))

    await waitFor(() => expect(setPropertyStatus).toHaveBeenCalledWith('p1', 'paused'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Imóvel pausado.'))
  })

  it('clicar em "Voltar para rascunho" chama action com draft', async () => {
    const user = userEvent.setup()
    render(<PropertyStatusMenu id="p1" status="paused" slug="x" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Voltar para rascunho' }))

    await waitFor(() => expect(setPropertyStatus).toHaveBeenCalledWith('p1', 'draft'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Imóvel voltou para rascunho.'))
  })

  it('erro do server mostra toast.error e não chama success', async () => {
    const user = userEvent.setup()
    setPropertyStatus.mockResolvedValueOnce({ ok: false, error: 'Sem permissão.' })
    render(<PropertyStatusMenu id="p1" status="draft" slug="x" />)

    await user.click(screen.getByRole('button', { name: 'Ações do imóvel' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Publicar' }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Sem permissão.'))
    expect(toastSuccess).not.toHaveBeenCalled()
  })
})
