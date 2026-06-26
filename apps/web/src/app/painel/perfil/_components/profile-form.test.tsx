import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileForm } from './profile-form'

vi.mock('@/lib/firebase/client', () => ({
  getClientAuth: (): { currentUser: { uid: string } } => ({ currentUser: { uid: 'uid-1' } }),
  getClientDb: (): object => ({}),
}))

const setDoc = vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue(undefined)
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: (...args: unknown[]): unknown => setDoc(...args),
  serverTimestamp: () => 'timestamp',
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderWith(initial = { phone: '', creci: '' }) {
  render(
    <ProfileForm
      uid="uid-1"
      displayName="Juliana Prado"
      email="juliana@example.com"
      avatarUrl={null}
      initialValues={initial}
    />,
  )
}

beforeEach(() => {
  setDoc.mockClear()
})
afterEach(() => {
  vi.clearAllMocks()
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
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('bloqueia save com CRECI vazio', async () => {
    const user = userEvent.setup()
    renderWith()

    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Informe seu CRECI/)).toBeInTheDocument()
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('salva com dados válidos e envia trim de CRECI', async () => {
    const user = userEvent.setup()
    renderWith()

    await user.type(screen.getByLabelText('Celular'), '92999990000')
    await user.type(screen.getByLabelText('CRECI'), '  CRECI-AM 1234-F  ')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(setDoc).toHaveBeenCalledTimes(1))
    const payload = setDoc.mock.calls[0]![1]
    expect(payload).toMatchObject({
      phone: '(92) 99999-0000',
      creci: 'CRECI-AM 1234-F',
    })
  })

  it('pré-popula com initialValues', () => {
    renderWith({ phone: '(92) 99999-0000', creci: 'CRECI-AM 9999' })
    expect(screen.getByLabelText('Celular')).toHaveValue('(92) 99999-0000')
    expect(screen.getByLabelText('CRECI')).toHaveValue('CRECI-AM 9999')
  })

  it('mostra erro inline quando setDoc rejeita', async () => {
    const user = userEvent.setup()
    setDoc.mockRejectedValueOnce(new Error('network'))

    renderWith()
    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    await user.type(screen.getByLabelText('CRECI'), 'CRECI-AM 1234')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument()
  })
})
