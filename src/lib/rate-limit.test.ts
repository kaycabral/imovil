import { describe, expect, it } from 'vitest'
import { clientIp, createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  it('permite até `capacity` requests dentro da janela', () => {
    const now = 1_000_000
    const rl = createRateLimiter({ capacity: 3, windowMs: 60_000, now: () => now })

    expect(rl.check('ip-1')).toEqual({ ok: true })
    expect(rl.check('ip-1')).toEqual({ ok: true })
    expect(rl.check('ip-1')).toEqual({ ok: true })
    const blocked = rl.check('ip-1')
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('reseta após a janela expirar', () => {
    let now = 1_000_000
    const rl = createRateLimiter({ capacity: 2, windowMs: 60_000, now: () => now })

    rl.check('ip-1')
    rl.check('ip-1')
    expect(rl.check('ip-1').ok).toBe(false)

    now += 60_001
    expect(rl.check('ip-1')).toEqual({ ok: true })
  })

  it('isola buckets por chave', () => {
    const now = 1_000_000
    const rl = createRateLimiter({ capacity: 1, windowMs: 60_000, now: () => now })

    expect(rl.check('ip-1')).toEqual({ ok: true })
    expect(rl.check('ip-1').ok).toBe(false)
    expect(rl.check('ip-2')).toEqual({ ok: true })
  })

  it('retryAfterSeconds reflete o tempo restante na janela', () => {
    let now = 1_000_000
    const rl = createRateLimiter({ capacity: 1, windowMs: 60_000, now: () => now })

    rl.check('ip-1')
    now += 30_000
    const result = rl.check('ip-1')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.retryAfterSeconds).toBe(30)
    }
  })
})

describe('clientIp', () => {
  it('extrai do x-forwarded-for (primeiro IP)', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.42, 10.0.0.1' },
    })
    expect(clientIp(req)).toBe('203.0.113.42')
  })

  it('cai para x-real-ip se x-forwarded-for ausente', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-real-ip': '203.0.113.42' },
    })
    expect(clientIp(req)).toBe('203.0.113.42')
  })

  it('retorna 127.0.0.1 sem nenhum header', () => {
    const req = new Request('http://example.com')
    expect(clientIp(req)).toBe('127.0.0.1')
  })
})
