import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { geocodeAddress } from './geocode'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())

describe('geocodeAddress', () => {
  it('consulta Nominatim com query + countrycodes=br e User-Agent', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json([{ lat: '-3.123456', lon: '-60.987654' }]))
    vi.stubGlobal('fetch', mockFetch)

    await geocodeAddress({
      street: 'Rua X',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
    })

    const call = mockFetch.mock.calls[0]
    expect(call).toBeDefined()
    const [url, init] = call!
    // geocodeAddress sempre chama fetch com uma URL string (url.toString()).
    if (typeof url !== 'string') throw new Error('expected fetch to be called with a string URL')
    const urlStr = url
    expect(urlStr).toContain('https://nominatim.openstreetmap.org/search')
    expect(urlStr).toContain('countrycodes=br')
    expect(urlStr).toContain('format=json')
    expect(urlStr).toContain('limit=1')
    const headers = new Headers(init?.headers)
    expect(headers.get('User-Agent')).toContain('imovil')
  })

  it('snapa coords pra grade de 0.003° (~333m, próximo de 300m aproximado)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ lat: '-3.1234', lon: '-60.9876' }]),
      }),
    )

    const coords = await geocodeAddress({
      neighborhood: 'A',
      city: 'Manaus',
      state: 'AM',
    })
    expect(coords).not.toBeNull()
    // Cada coord deve ser múltiplo de 0.003 (com tolerância de float point)
    expect(Math.round(coords!.lat / 0.003)).toBeCloseTo(coords!.lat / 0.003, 6)
    expect(Math.round(coords!.lng / 0.003)).toBeCloseTo(coords!.lng / 0.003, 6)
    // E deve ser o múltiplo mais próximo do input original
    expect(coords!.lat).toBeCloseTo(Math.round(-3.1234 / 0.003) * 0.003, 6)
    expect(coords!.lng).toBeCloseTo(Math.round(-60.9876 / 0.003) * 0.003, 6)
  })

  it('retorna null quando Nominatim devolve array vazio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }))
    const coords = await geocodeAddress({
      neighborhood: 'A',
      city: 'B',
      state: 'C',
    })
    expect(coords).toBeNull()
  })

  it('retorna null quando o fetch falha (best-effort, não propaga)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const coords = await geocodeAddress({
      neighborhood: 'A',
      city: 'B',
      state: 'C',
    })
    expect(coords).toBeNull()
  })

  it('retorna null quando resposta não é 2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    const coords = await geocodeAddress({
      neighborhood: 'A',
      city: 'B',
      state: 'C',
    })
    expect(coords).toBeNull()
  })

  it('retorna null quando lat/lon não são números válidos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ lat: 'abc', lon: 'xyz' }]),
      }),
    )
    const coords = await geocodeAddress({
      neighborhood: 'A',
      city: 'B',
      state: 'C',
    })
    expect(coords).toBeNull()
  })
})
