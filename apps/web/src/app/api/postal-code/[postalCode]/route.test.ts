import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { GET } from './route'

const responseBodySchema = z
  .object({
    error: z.string(),
    postalCode: z.string(),
    state: z.string(),
    city: z.string(),
    neighborhood: z.string(),
    street: z.string(),
  })
  .partial()

async function readBody(res: Response) {
  return responseBodySchema.parse(await res.json())
}

function buildReq(path = '/api/postal-code/69057070') {
  return new Request(`http://localhost${path}`)
}
function buildContext(postalCode: string) {
  return { params: Promise.resolve({ postalCode }) }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())

describe('/api/postal-code/[postalCode]', () => {
  it('retorna 400 se CEP não tem 8 dígitos', async () => {
    const res = await GET(buildReq(), buildContext('abc'))
    expect(res.status).toBe(400)
    const body = await readBody(res)
    expect(body.error).toBe('CEP inválido.')
  })

  it('retorna 400 se CEP normalizado tem menos de 8 dígitos', async () => {
    const res = await GET(buildReq(), buildContext('1234-567'))
    expect(res.status).toBe(400)
  })

  it('normaliza CEP com traço antes de chamar BrasilAPI', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          cep: '69057-070',
          state: 'AM',
          city: 'Manaus',
          neighborhood: 'Adrianópolis',
          street: 'Rua',
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await GET(buildReq(), buildContext('69057-070'))
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://brasilapi.com.br/api/cep/v2/69057070',
      expect.any(Object),
    )
  })

  it('retorna 404 quando BrasilAPI responde 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const res = await GET(buildReq(), buildContext('12345678'))
    expect(res.status).toBe(404)
    const body = await readBody(res)
    expect(body.error).toBe('CEP não encontrado.')
  })

  it('retorna 502 quando BrasilAPI responde com outro erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const res = await GET(buildReq(), buildContext('12345678'))
    expect(res.status).toBe(502)
  })

  it('devolve payload normalizado com postalCode sem traço', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            cep: '69057-070',
            state: 'AM',
            city: 'Manaus',
            neighborhood: 'Adrianópolis',
            street: 'Rua Teste',
          }),
      }),
    )

    const res = await GET(buildReq(), buildContext('69057-070'))
    expect(res.status).toBe(200)
    const body = await readBody(res)
    expect(body).toEqual({
      postalCode: '69057070',
      state: 'AM',
      city: 'Manaus',
      neighborhood: 'Adrianópolis',
      street: 'Rua Teste',
    })
  })

  it('preenche campos faltantes com string vazia (ex: CEP rural sem bairro)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            cep: '12345678',
            state: 'AM',
            city: 'Manaus',
            // sem neighborhood nem street
          }),
      }),
    )

    const res = await GET(buildReq(), buildContext('12345678'))
    const body = await readBody(res)
    expect(body.neighborhood).toBe('')
    expect(body.street).toBe('')
  })
})
