import { clientIp, createRateLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// 30 lookups por minuto por IP. Broker normal usa 1-3 CEPs por sessão; 30/min
// cobre uso legítimo com folga e barra varredura amadora. Limitação conhecida:
// in-memory, reseta em cold start (ver lib/rate-limit.ts).
const limiter = createRateLimiter({ capacity: 30, windowMs: 60_000 })

// BrasilAPI pode omitir campos (ex.: CEP rural sem bairro/logradouro); tudo opcional
// e os fallbacks abaixo cobrem o que faltar. `.catch` mantém o parse resiliente a
// tipos inesperados sem virar 5xx.
const brasilApiResponseSchema = z
  .object({
    cep: z.string().optional().catch(undefined),
    state: z.string().optional().catch(undefined),
    city: z.string().optional().catch(undefined),
    neighborhood: z.string().optional().catch(undefined),
    street: z.string().optional().catch(undefined),
  })
  .catch({})

export type PostalCodeLookup = {
  postalCode: string
  state: string
  city: string
  neighborhood: string
  street: string
}

export const revalidate = 604800

export async function GET(req: Request, { params }: { params: Promise<{ postalCode: string }> }) {
  const ip = clientIp(req)
  const rate = limiter.check(`postal:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Muitas consultas. Tente novamente em alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    )
  }

  const { postalCode: raw } = await params
  const normalized = raw.replace(/\D/g, '')
  if (!/^\d{8}$/.test(normalized)) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 })
  }

  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${normalized}`, {
    next: { revalidate: 604800 },
  })
  if (res.status === 404) {
    return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'Falha na consulta do endereço.' }, { status: 502 })
  }

  const data = brasilApiResponseSchema.parse(await res.json())
  const result: PostalCodeLookup = {
    postalCode: (data.cep ?? normalized).replace(/\D/g, ''),
    state: data.state ?? '',
    city: data.city ?? '',
    neighborhood: data.neighborhood ?? '',
    street: data.street ?? '',
  }
  return NextResponse.json(result)
}
