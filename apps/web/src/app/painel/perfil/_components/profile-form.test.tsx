import type { UpdateBrokerProfileResult } from '@/app/actions/profile'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileForm } from './profile-form'

type Contact = { phone: string; creci: string }

const updateBrokerProfile = vi.fn<(input: Contact) => Promise<UpdateBrokerProfileResult>>()
vi.mock('@/app/actions/profile', () => ({
  updateBrokerProfile: (input: Contact) => updateBrokerProfile(input),
}))

const toastSuccess = vi.fn<(message: string) => void>()
vi.mock('sonner', () => ({
  toast: { success: (message: string) => toastSuccess(message), error: vi.fn() },
}))

function renderWith(initial = { phone: '', creci: '' }) {
  render(
    <ProfileForm
      displayName="Juliana Prado"
      email="juliana@example.com"
      avatarUrl={null}
      initialValues={initial}
    />,
  )
}

beforeEach(() => {
  updateBrokerProfile.mockResolvedValue({ ok: true })
})
afterEach(() => {
  vi.resetAllMocks()
})

describe('ProfileForm', () => {
  it('mostra nome e email da conta Google', () => {
    renderWith()
    expect(screen.getByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByText('juliana@example.com')).toBeInTheDocument()
  })

  it('bloqueia save com celular menor que 10 dígitos', async () => {
    const user = userEvent.setup()
    renderWith()

    await user.type(screen.getByLabelText('Celular'), '(92) 9999')
    await user.type(screen.getByLabelText('CRECI'), 'CRECI-AM 1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/celular válido/i)).toBeInTheDocument()
    expect(updateBrokerProfile).not.toHaveBeenCalled()
  })

  it('bloqueia save com CRECI vazio', async () => {
    const user = userEvent.setup()
    renderWith()

    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Informe seu CRECI/)).toBeInTheDocument()
    expect(updateBrokerProfile).not.toHaveBeenCalled()
  })

  it('salva com dados válidos, envia trim de CRECI e mostra toast de sucesso', async () => {
    const user = userEvent.setup()
    renderWith()

    await user.type(screen.getByLabelText('Celular'), '92999990000')
    await user.type(screen.getByLabelText('CRECI'), '  CRECI-AM 1234-F  ')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(updateBrokerProfile).toHaveBeenCalledTimes(1))
    expect(updateBrokerProfile).toHaveBeenCalledWith({
      phone: '(92) 99999-0000',
      creci: 'CRECI-AM 1234-F',
    })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Perfil atualizado.'))
  })

  it('pré-popula com initialValues', () => {
    renderWith({ phone: '(92) 99999-0000', creci: 'CRECI-AM 9999' })
    expect(screen.getByLabelText('Celular')).toHaveValue('(92) 99999-0000')
    expect(screen.getByLabelText('CRECI')).toHaveValue('CRECI-AM 9999')
  })

  it('mostra a mensagem de erro devolvida pelo servidor', async () => {
    const user = userEvent.setup()
    updateBrokerProfile.mockResolvedValueOnce({
      ok: false,
      error: 'Sessão expirada — entre novamente.',
    })

    renderWith({ phone: '(92) 99999-0000', creci: 'CRECI-AM 1234' })
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Sessão expirada — entre novamente.')).toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('mostra erro inline quando a action rejeita', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    updateBrokerProfile.mockRejectedValueOnce(new Error('network'))

    renderWith()
    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    await user.type(screen.getByLabelText('CRECI'), 'CRECI-AM 1234')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
