import type { PropertyCoords } from '@tekoa/shared'
import { z } from 'zod'

// Nominatim devolve um array; só lat/lon nos interessam. Itens malformados são
// descartados (`.catch([])`) — o consumo já trata array vazio retornando null.
const nominatimResponseSchema = z.array(z.object({ lat: z.string(), lon: z.string() })).catch([])

type GeocodeQuery = {
  street?: string
  neighborhood: string
  city: string
  state: string
}

// Endpoint público do OSM — grátis, sem API key, e é o valor de prod pretendido.
// Override via NOMINATIM_URL pra uma instância self-hosted/proxy (ex.: no E2E).
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * Geocoding via Nominatim (OSM). Grátis e sem API key, mas com rate limit de 1 req/s
 * e exigência de User-Agent identificável. Chamado uma vez por imóvel no create.
 *
 * Snap pra grade de ~0.003° (~333m, próximo do "aproximado em 300m" que mostramos na UI)
 * — o endereço exato segue sob sigilo até a confirmação da visita.
 */
export async function geocodeAddress(query: GeocodeQuery): Promise<PropertyCoords | null> {
  const q = [query.street, query.neighborhood, query.city, query.state, 'Brasil']
    .filter(Boolean)
    .join(', ')

  const url = new URL(process.env.NOMINATIM_URL ?? DEFAULT_NOMINATIM_URL)
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'tekoa-server/1.0 (contact: dev@tekoa.com.br)' },
    })
    if (!res.ok) return null
    const data = nominatimResponseSchema.parse(await res.json())
    const first = data[0]
    if (!first) return null
    const lat = roundCoord(Number(first.lat))
    const lng = roundCoord(Number(first.lon))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

// 1° de latitude ≈ 111km; 0.003° ≈ 333m (bom proxy pra "aproximação de 300m").
const GRID_DEGREES = 0.003

function roundCoord(n: number): number {
  return Math.round(n / GRID_DEGREES) * GRID_DEGREES
}
