import type { CreatePropertyResult, UpdatePropertyResult } from '@/app/actions/properties'
import type { PropertyCreateInput } from '@tekoa/shared'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyForm, type PropertyFormProfile } from './property-form'

function parseDraft(raw: string): { values: { title: string } } {
  const value: unknown = JSON.parse(raw)
  if (
    typeof value === 'object' &&
    value !== null &&
    'values' in value &&
    typeof value.values === 'object' &&
    value.values !== null &&
    'title' in value.values &&
    typeof value.values.title === 'string'
  ) {
    return { values: { title: value.values.title } }
  }
  throw new Error('invalid draft shape')
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/firebase/client', () => ({
  getClientAuth: () => ({ currentUser: { uid: 'uid-1' } }),
  getClientDb: () => ({}),
  getClientStorage: () => ({}),
}))

const setDoc = vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined)
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: (...args: unknown[]) => setDoc(...args),
  serverTimestamp: () => 'timestamp',
}))

const uploadBytes = vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined)
const getDownloadURL = vi
  .fn<(...args: unknown[]) => Promise<string>>()
  .mockResolvedValue('https://firebasestorage.googleapis.com/fake.jpg')
const deleteObject = vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined)
vi.mock('firebase/storage', () => ({
  uploadBytes: (...args: unknown[]) => uploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => getDownloadURL(...args),
  deleteObject: (...args: unknown[]) => deleteObject(...args),
  ref: vi.fn((_: unknown, path: string) => ({ fullPath: path })),
}))

const createProperty = vi
  .fn<(input: PropertyCreateInput) => Promise<CreatePropertyResult>>()
  .mockResolvedValue({ ok: true, id: 'abc', slug: 'test' })
const updateProperty = vi
  .fn<(propertyId: string, input: PropertyCreateInput) => Promise<UpdatePropertyResult>>()
  .mockResolvedValue({ ok: true, slug: 'test' })
vi.mock('@/app/actions/properties', () => ({
  createProperty: (input: PropertyCreateInput) => createProperty(input),
  updateProperty: (propertyId: string, input: PropertyCreateInput) =>
    updateProperty(propertyId, input),
}))

const toastSuccess = vi.fn<(...args: unknown[]) => void>()
const toastError = vi.fn<(...args: unknown[]) => void>()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

const profileWithPhone: PropertyFormProfile = {
  uid: 'uid-1',
  phone: '(92) 99999-0000',
  creci: 'CRECI-AM 1234-F',
}
const profileNoPhone: PropertyFormProfile = {
  uid: 'uid-1',
  phone: null,
  creci: null,
}

beforeEach(() => {
  window.localStorage.clear()
  setDoc.mockClear()
  uploadBytes.mockClear()
  getDownloadURL.mockClear()
  deleteObject.mockClear()
  createProperty.mockClear()
  updateProperty.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
  createProperty.mockResolvedValue({ ok: true, id: 'abc', slug: 'test' })
  updateProperty.mockResolvedValue({ ok: true, slug: 'test' })
  // Mock global fetch used pelo lookup de CEP.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          postalCode: '69057070',
          state: 'AM',
          city: 'Manaus',
          neighborhood: 'Adrianópolis',
          street: 'Rua Teste',
        }),
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PropertyForm — structure', () => {
  it('renderiza as sections principais sem a seção de corretor', () => {
    render(<PropertyForm profile={profileWithPhone} />)
    expect(screen.getByText('Anúncio')).toBeInTheDocument()
    expect(screen.getByText('Localização')).toBeInTheDocument()
    expect(screen.getByText('Valores e detalhes')).toBeInTheDocument()
    expect(screen.getByText('Imagens')).toBeInTheDocument()
    expect(screen.queryByText('Corretor responsável')).not.toBeInTheDocument()
  })

  it('usa o label "Valor do aluguel" por padrão e troca para "Valor de venda" ao trocar modalidade', async () => {
    const user = userEvent.setup()
    render(<PropertyForm profile={profileWithPhone} />)

    expect(screen.getByText('Valor do aluguel')).toBeInTheDocument()

    // Radix Select é flaky em jsdom — abrimos o combobox de "Modalidade" e
    // selecionamos "Venda" via click no option visível.
    const dealCombobox = screen.getAllByRole('combobox')[0]!
    await user.click(dealCombobox)
    const saleOption = await screen.findByRole('option', { name: 'Venda' })
    await user.click(saleOption)

    await waitFor(() => {
      expect(screen.getByText('Valor de venda')).toBeInTheDocument()
    })
  })
})

describe('PropertyForm — CEP autofill', () => {
  it('dispara lookup quando o CEP chega em 8 dígitos e mostra o resumo', async () => {
    const user = userEvent.setup()
    render(<PropertyForm profile={profileWithPhone} />)

    await user.type(screen.getByLabelText(/CEP/), '69057070')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/postal-code/69057070')
    })
    await waitFor(() => {
      expect(screen.getByText('Rua Teste')).toBeInTheDocument()
    })
    expect(screen.getByText(/Adrianópolis.*Manaus.*AM/)).toBeInTheDocument()
  })

  it('mostra aviso destrutivo quando o CEP não retorna bairro', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            postalCode: '12345678',
            state: 'AM',
            city: 'Manaus',
            neighborhood: '',
            street: '',
          }),
      }),
    )

    render(<PropertyForm profile={profileWithPhone} />)
    await user.type(screen.getByLabelText(/CEP/), '12345678')

    await waitFor(() => {
      expect(screen.getByText(/Esse CEP não tem bairro cadastrado/)).toBeInTheDocument()
    })
  })
})

describe('PropertyForm — MoneyField', () => {
  it('formata input como "R$ X.XXX,XX" (cents-first)', () => {
    render(<PropertyForm profile={profileWithPhone} />)

    // Label→input wiring: usuário acha pelo label, não por placeholder ou CSS.
    const valueInput = screen.getByLabelText('Valor do aluguel')
    fireEvent.change(valueInput, { target: { value: '280050' } })

    expect(valueInput).toHaveValue('2.800,50')
  })

  it('remove caracteres não-numéricos (onChange sanitiza)', () => {
    render(<PropertyForm profile={profileWithPhone} />)

    const valueInput = screen.getByLabelText('Valor do aluguel')
    fireEvent.change(valueInput, { target: { value: '28,50abc' } })

    // "28", "5", "0" → 2850 cents → "28,50"
    expect(valueInput).toHaveValue('28,50')
  })
})

describe('PropertyForm — validation gates', () => {
  it('bloqueia submit quando nenhuma imagem foi enviada (mesmo com form totalmente preenchido)', async () => {
    const user = userEvent.setup()
    // Rascunho completo, exceto imagens
    window.localStorage.setItem(
      'property-form:draft:uid-1',
      JSON.stringify({
        values: {
          kind: 'apartment',
          deal: 'rental',
          title: 'Apartamento test',
          subtitle: '',
          postalCode: '69057070',
          street: 'Rua',
          neighborhood: 'Bairro',
          state: 'AM',
          city: 'Manaus',
          price: 280000,
          condo: 0,
          iptu: 0,
          area: 50,
          rooms: 2,
          suites: 0,
          parking: 0,
          petFriendly: false,
          furnished: false,
          transitDistanceMin: 0,
          transitLabel: '',
          builtYear: 2020,
          descriptionText: 'Descrição qualquer.',
        },
        images: [],
        postalCodeInput: '69057070',
        postalCodeResult: {
          postalCode: '69057070',
          state: 'AM',
          city: 'Manaus',
          neighborhood: 'Bairro',
          street: 'Rua',
        },
        savedAt: Date.now(),
      }),
    )

    render(<PropertyForm profile={profileWithPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Apartamento test'))

    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    expect(await screen.findByText('Envie ao menos 1 imagem.')).toBeInTheDocument()
    expect(createProperty).not.toHaveBeenCalled()
  })
})

describe('PropertyForm — persistência em localStorage', () => {
  it('salva o rascunho em localStorage a cada mudança', async () => {
    const user = userEvent.setup()
    render(<PropertyForm profile={profileWithPhone} />)

    await user.type(screen.getByLabelText(/Título/), 'Meu imóvel')

    await waitFor(() => {
      const raw = window.localStorage.getItem('property-form:draft:uid-1')
      expect(raw).toBeTruthy()
      const parsed = parseDraft(raw!)
      expect(parsed.values.title).toBe('Meu imóvel')
    })
  })

  it('restaura o rascunho do localStorage na montagem', async () => {
    window.localStorage.setItem(
      'property-form:draft:uid-1',
      JSON.stringify({
        values: {
          kind: 'studio',
          deal: 'sale',
          title: 'Título salvo',
          subtitle: '',
          postalCode: '',
          street: '',
          neighborhood: '',
          state: '',
          city: '',
          price: 150000,
          condo: 0,
          iptu: 0,
          area: 40,
          rooms: 1,
          suites: 0,
          parking: 0,
          petFriendly: false,
          furnished: false,
          transitDistanceMin: 0,
          transitLabel: '',
          builtYear: 2026,
          descriptionText: 'Desc',
        },
        images: [],
        postalCodeInput: '',
        postalCodeResult: null,
        savedAt: Date.now(),
      }),
    )

    render(<PropertyForm profile={profileWithPhone} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Título/)).toHaveValue('Título salvo')
    })
  })

  it('limpa o rascunho via botão "Limpar rascunho" e deleta imagens do Storage', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    window.localStorage.setItem(
      'property-form:draft:uid-1',
      JSON.stringify({
        values: {
          kind: 'apartment',
          deal: 'rental',
          title: 'Título a limpar',
          subtitle: '',
          postalCode: '',
          street: '',
          neighborhood: '',
          state: '',
          city: '',
          price: 0,
          condo: 0,
          iptu: 0,
          area: 0,
          rooms: 1,
          suites: 0,
          parking: 0,
          petFriendly: false,
          furnished: false,
          transitDistanceMin: 0,
          transitLabel: '',
          builtYear: 2026,
          descriptionText: '',
        },
        images: [
          { path: 'properties/uid-1/x/a.jpg', src: 'https://fake/a.jpg', alt: 'a' },
          { path: 'properties/uid-1/x/b.jpg', src: 'https://fake/b.jpg', alt: 'b' },
        ],
        postalCodeInput: '',
        postalCodeResult: null,
        savedAt: Date.now(),
      }),
    )

    const user = userEvent.setup()
    render(<PropertyForm profile={profileWithPhone} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Título/)).toHaveValue('Título a limpar')
    })

    await user.click(screen.getByRole('button', { name: /Limpar rascunho/i }))

    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByLabelText(/Título/)).toHaveValue('')
    })
    expect(deleteObject).toHaveBeenCalledTimes(2)
    await waitFor(() => {
      expect(window.localStorage.getItem('property-form:draft:uid-1')).toBeNull()
    })

    confirmSpy.mockRestore()
  })
})

describe('PropertyForm — phone dialog', () => {
  it('abre o dialog de telefone no submit quando profile.phone está vazio', async () => {
    const user = userEvent.setup()
    // pré-popula um rascunho com imagem (pra não ser bloqueado pelo "envie ao menos 1 imagem")
    window.localStorage.setItem(
      'property-form:draft:uid-1',
      JSON.stringify({
        values: {
          kind: 'apartment',
          deal: 'rental',
          title: 'Válido suficiente',
          subtitle: '',
          postalCode: '69057070',
          street: 'Rua',
          neighborhood: 'Bairro',
          state: 'AM',
          city: 'Manaus',
          price: 280000,
          condo: 0,
          iptu: 0,
          area: 50,
          rooms: 2,
          suites: 0,
          parking: 0,
          petFriendly: false,
          furnished: false,
          transitDistanceMin: 0,
          transitLabel: '',
          builtYear: 2020,
          descriptionText: 'Descrição qualquer.',
        },
        images: [{ path: 'x/y.jpg', src: 'https://fake/a.jpg', alt: 'a' }],
        postalCodeInput: '69057070',
        postalCodeResult: {
          postalCode: '69057070',
          state: 'AM',
          city: 'Manaus',
          neighborhood: 'Bairro',
          street: 'Rua',
        },
        savedAt: Date.now(),
      }),
    )

    render(<PropertyForm profile={profileNoPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Válido suficiente'))

    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    expect(await screen.findByText(/Quase lá — precisamos do seu contato/)).toBeInTheDocument()
    expect(createProperty).not.toHaveBeenCalled()
  })

  it('pula o dialog e chama createProperty quando phone já existe', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'property-form:draft:uid-1',
      JSON.stringify({
        values: {
          kind: 'apartment',
          deal: 'rental',
          title: 'Título ok',
          subtitle: '',
          postalCode: '69057070',
          street: 'Rua',
          neighborhood: 'Bairro',
          state: 'AM',
          city: 'Manaus',
          price: 280000,
          condo: 0,
          iptu: 0,
          area: 50,
          rooms: 2,
          suites: 0,
          parking: 0,
          petFriendly: false,
          furnished: false,
          transitDistanceMin: 0,
          transitLabel: '',
          builtYear: 2020,
          descriptionText: 'Descrição qualquer.',
        },
        images: [{ path: 'x/y.jpg', src: 'https://fake/a.jpg', alt: 'a' }],
        postalCodeInput: '69057070',
        postalCodeResult: {
          postalCode: '69057070',
          state: 'AM',
          city: 'Manaus',
          neighborhood: 'Bairro',
          street: 'Rua',
        },
        savedAt: Date.now(),
      }),
    )

    render(<PropertyForm profile={profileWithPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))

    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    expect(screen.queryByText(/Quase lá/)).not.toBeInTheDocument()
    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1))

    const [payload] = createProperty.mock.calls[0]!
    expect(payload).toMatchObject({
      kind: 'apartment',
      deal: 'rental',
      price: 280000,
      postalCode: '69057070',
      neighborhood: 'Bairro',
      city: 'Manaus',
      state: 'AM',
      images: expect.arrayContaining([expect.objectContaining({ path: 'x/y.jpg' })]),
    })
    // a descrição precisa virar array de parágrafos
    expect(payload.description).toEqual(['Descrição qualquer.'])
  })
})

describe('PropertyForm — submit happy path', () => {
  const readyDraft = JSON.stringify({
    values: {
      kind: 'apartment',
      deal: 'rental',
      title: 'Título ok',
      subtitle: '',
      postalCode: '69057070',
      street: 'Rua',
      neighborhood: 'Bairro',
      state: 'AM',
      city: 'Manaus',
      price: 280000,
      condo: 0,
      iptu: 0,
      area: 50,
      rooms: 2,
      suites: 0,
      parking: 0,
      petFriendly: false,
      furnished: false,
      transitDistanceMin: 0,
      transitLabel: '',
      builtYear: 2020,
      descriptionText: 'Descrição.',
    },
    images: [{ path: 'x/y.jpg', src: 'https://fake/a.jpg', alt: 'a' }],
    postalCodeInput: '69057070',
    postalCodeResult: {
      postalCode: '69057070',
      state: 'AM',
      city: 'Manaus',
      neighborhood: 'Bairro',
      street: 'Rua',
    },
    savedAt: Date.now(),
  })

  it('sucesso: chama createProperty, mostra toast, limpa localStorage', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('property-form:draft:uid-1', readyDraft)

    render(<PropertyForm profile={profileWithPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))

    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Imóvel criado como rascunho.'))
    await waitFor(() => expect(window.localStorage.getItem('property-form:draft:uid-1')).toBeNull())
  })

  it('erro do server: mostra toast.error e mantém o rascunho', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('property-form:draft:uid-1', readyDraft)
    createProperty.mockResolvedValueOnce({ ok: false, error: 'Falha no servidor' })

    render(<PropertyForm profile={profileWithPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))

    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Falha no servidor'))
    expect(toastSuccess).not.toHaveBeenCalled()
    // rascunho permanece
    expect(window.localStorage.getItem('property-form:draft:uid-1')).not.toBeNull()
  })
})

describe('BrokerContactDialog — validação', () => {
  function draftWithoutBrokerInfo() {
    return JSON.stringify({
      values: {
        kind: 'apartment',
        deal: 'rental',
        title: 'Título ok',
        subtitle: '',
        postalCode: '69057070',
        street: 'Rua',
        neighborhood: 'Bairro',
        state: 'AM',
        city: 'Manaus',
        price: 280000,
        condo: 0,
        iptu: 0,
        area: 50,
        rooms: 2,
        suites: 0,
        parking: 0,
        petFriendly: false,
        furnished: false,
        transitDistanceMin: 0,
        transitLabel: '',
        builtYear: 2020,
        descriptionText: 'Descrição.',
      },
      images: [{ path: 'x/y.jpg', src: 'https://fake/a.jpg', alt: 'a' }],
      postalCodeInput: '69057070',
      postalCodeResult: {
        postalCode: '69057070',
        state: 'AM',
        city: 'Manaus',
        neighborhood: 'Bairro',
        street: 'Rua',
      },
      savedAt: Date.now(),
    })
  }

  it('bloqueia com celular inválido', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('property-form:draft:uid-1', draftWithoutBrokerInfo())

    render(<PropertyForm profile={profileNoPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))
    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    await screen.findByText(/Quase lá/)
    await user.type(screen.getByLabelText('Celular'), '9291')
    await user.type(screen.getByLabelText('CRECI'), 'CRECI-AM 1')
    await user.click(screen.getByRole('button', { name: /Salvar e publicar/i }))

    expect(await screen.findByText(/celular válido/i)).toBeInTheDocument()
    expect(setDoc).not.toHaveBeenCalled()
    expect(createProperty).not.toHaveBeenCalled()
  })

  it('bloqueia com CRECI vazio', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('property-form:draft:uid-1', draftWithoutBrokerInfo())

    render(<PropertyForm profile={profileNoPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))
    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    await screen.findByText(/Quase lá/)
    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    // CRECI em branco
    await user.click(screen.getByRole('button', { name: /Salvar e publicar/i }))

    expect(await screen.findByText(/Informe seu CRECI/)).toBeInTheDocument()
    expect(setDoc).not.toHaveBeenCalled()
    expect(createProperty).not.toHaveBeenCalled()
  })

  it('salva contato e segue com createProperty quando tudo válido', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('property-form:draft:uid-1', draftWithoutBrokerInfo())

    render(<PropertyForm profile={profileNoPhone} />)
    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue('Título ok'))
    await user.click(screen.getByRole('button', { name: /Salvar como rascunho/i }))

    await screen.findByText(/Quase lá/)
    await user.type(screen.getByLabelText('Celular'), '(92) 99999-0000')
    await user.type(screen.getByLabelText('CRECI'), 'CRECI-AM 1234')
    await user.click(screen.getByRole('button', { name: /Salvar e publicar/i }))

    await waitFor(() => expect(setDoc).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1))
  })
})

describe('PropertyForm — edit mode', () => {
  function buildInitial() {
    return {
      values: {
        kind: 'apartment' as const,
        deal: 'rental' as const,
        title: 'Já existia',
        subtitle: '',
        postalCode: '69057070',
        street: 'Rua',
        neighborhood: 'Bairro',
        state: 'AM',
        city: 'Manaus',
        price: 280000,
        condo: 0,
        iptu: 0,
        area: 50,
        rooms: 2,
        suites: 0,
        parking: 0,
        petFriendly: false,
        furnished: false,
        transitDistanceMin: 0,
        transitLabel: '',
        builtYear: 2020,
        descriptionText: 'Descrição restaurada.',
      },
      images: [{ path: 'p/1', src: 'https://x/y.jpg', alt: 'a' }],
      postalCodeInput: '69057-070',
      postalCodeResult: {
        postalCode: '69057070',
        state: 'AM',
        city: 'Manaus',
        neighborhood: 'Bairro',
        street: 'Rua',
      },
    }
  }

  it('pré-popula com initial e mostra "Salvar alterações" em vez de rascunho', () => {
    render(
      <PropertyForm
        profile={profileWithPhone}
        mode="edit"
        propertyId="p42"
        initial={buildInitial()}
      />,
    )
    expect(screen.getByLabelText(/Título/)).toHaveValue('Já existia')
    expect(screen.getByRole('button', { name: /Salvar alterações/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Salvar como rascunho/i })).not.toBeInTheDocument()
  })

  it('não mostra o botão "Limpar rascunho" em edit', () => {
    render(
      <PropertyForm
        profile={profileWithPhone}
        mode="edit"
        propertyId="p42"
        initial={buildInitial()}
      />,
    )
    expect(screen.queryByRole('button', { name: /Limpar rascunho/i })).not.toBeInTheDocument()
  })

  it('no submit chama updateProperty(propertyId, payload) em vez de createProperty', async () => {
    const user = userEvent.setup()
    render(
      <PropertyForm
        profile={profileWithPhone}
        mode="edit"
        propertyId="p42"
        initial={buildInitial()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Salvar alterações/i }))

    await waitFor(() => expect(updateProperty).toHaveBeenCalledTimes(1))
    expect(createProperty).not.toHaveBeenCalled()
    const [id, payload] = updateProperty.mock.calls[0]!
    expect(id).toBe('p42')
    expect(payload).toMatchObject({ title: 'Já existia', kind: 'apartment' })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Alterações salvas.'))
  })

  it('não toca em localStorage em edit', async () => {
    const user = userEvent.setup()
    render(
      <PropertyForm
        profile={profileWithPhone}
        mode="edit"
        propertyId="p42"
        initial={buildInitial()}
      />,
    )

    await user.clear(screen.getByLabelText(/Título/))
    await user.type(screen.getByLabelText(/Título/), 'Título novo')

    expect(window.localStorage.getItem('property-form:draft:uid-1')).toBeNull()
  })
})

describe('PropertyForm — CEP lookup errors', () => {
  it('toast.error quando a rota /api/postal-code falha', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ error: 'Falha na consulta do endereço.' }),
        savedAt: Date.now(),
      }),
    )
    render(<PropertyForm profile={profileWithPhone} />)

    await user.type(screen.getByLabelText(/CEP/), '69057070')

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Falha na consulta do endereço.'))
  })
})

describe('PropertyForm — image upload', () => {
  it('sobe os arquivos para o Storage e adiciona ao grid', async () => {
    const user = userEvent.setup()
    render(<PropertyForm profile={profileWithPhone} />)

    const file = new File(['fake'], 'foto.jpg', { type: 'image/jpeg' })
    const input = screen.getAllByRole('textbox', { hidden: true }).concat([])
    // fallback: pega input file diretamente
    const fileInput = screen.getByLabelText('Adicionar imagens') as HTMLInputElement

    await act(async () => {
      await user.upload(fileInput, file)
    })

    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(screen.getByAltText('foto.jpg')).toBeInTheDocument()
    })

    // silencia warning do parametro não usado
    void input
  })

  // user.upload respeita o atributo accept="image/*" e filtra arquivos; pra testar o
  // validador interno, bypassamos com fireEvent.change direto. jsdom não tem
  // `DataTransfer`, então definimos `input.files` direto — `handleFiles` só lê
  // `.length` + `Array.from(files)`, ambos compatíveis com um array.
  function fireFileChange(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, 'files', { configurable: true, value: files })
    fireEvent.change(input)
  }

  it('rejeita arquivo que não é imagem com toast.error', async () => {
    render(<PropertyForm profile={profileWithPhone} />)

    const notAnImage = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText('Adicionar imagens') as HTMLInputElement

    act(() => {
      fireFileChange(fileInput, [notAnImage])
    })

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('não é uma imagem')),
    )
    expect(uploadBytes).not.toHaveBeenCalled()
  })

  it('rejeita arquivo acima de 5 MB com toast.error', async () => {
    render(<PropertyForm profile={profileWithPhone} />)

    const bigFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 })
    const fileInput = screen.getByLabelText('Adicionar imagens') as HTMLInputElement

    act(() => {
      fireFileChange(fileInput, [bigFile])
    })

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('máximo 5 MB')),
    )
    expect(uploadBytes).not.toHaveBeenCalled()
  })

  it('faz rollback (deleteObject) quando um upload no meio de uma rajada falha', async () => {
    const user = userEvent.setup()
    uploadBytes.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('network fail'))

    render(<PropertyForm profile={profileWithPhone} />)

    const file1 = new File(['a'], 'ok.jpg', { type: 'image/jpeg' })
    const file2 = new File(['b'], 'fail.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText('Adicionar imagens') as HTMLInputElement

    await act(async () => {
      await user.upload(fileInput, [file1, file2])
    })

    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalledTimes(2)
    })
    // o primeiro foi uploaded com sucesso; o segundo falhou; rollback deve apagar o primeiro
    await waitFor(() => {
      expect(deleteObject).toHaveBeenCalledTimes(1)
    })
  })
})
