import { clientIp, createRateLimiter } from '@/lib/rate-limit'
import { lookupPostalCode } from '@cbrl/br/postal-code'
import { NextResponse } from 'next/server'

// 30 lookups por minuto por IP. Broker normal usa 1-3 CEPs por sessão; 30/min
// cobre uso legítimo com folga e barra varredura amadora. Limitação conhecida:
// in-memory, reseta em cold start (ver lib/rate-limit.ts).
const limiter = createRateLimiter({ capacity: 30, windowMs: 60_000 })

const FAILURES = {
  invalid: { error: 'CEP inválido.', status: 400 },
  'not-found': { error: 'CEP não encontrado.', status: 404 },
  upstream: { error: 'Falha na consulta do endereço.', status: 502 },
} as const

export async function GET(req: Request, { params }: { params: Promise<{ postalCode: string }> }) {
  const ip = clientIp(req)
  const rate = limiter.check(`postal:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Muitas consultas. Tente novamente em alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    )
  }

  const { postalCode } = await params
  // BrasilAPI may omit fields (rural CEPs without neighborhood/street): they come back as ''.
  const result = await lookupPostalCode(postalCode, { init: { next: { revalidate: 604800 } } })
  if (!result.ok) {
    const { error, status } = FAILURES[result.reason]
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(result.address)
}
