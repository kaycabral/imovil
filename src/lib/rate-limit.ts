// Rate limit in-memory por IP. Implementação token-bucket simples, sem
// dependência externa (Upstash, Redis, Cloudflare).
//
// LIMITAÇÃO conhecida: estado vive em memória de cada instância de função da
// Vercel. Cold start zera os buckets e instâncias paralelas não compartilham
// estado — atacante distribuído passa fácil. Cobre abuso amador (1 IP
// varrendo) mas não DDoS coordenado.
//
// Pra robustez, mover pro rate limiting do Vercel Firewall (sem estado no app)
// quando aparecer demanda. Por ora basta — a base legal LGPD pra logar IP
// aqui é legítimo interesse (segurança operacional).

type Bucket = {
  tokens: number
  resetAt: number
}

export type RateLimiter = {
  check: (key: string) => { ok: true } | { ok: false; retryAfterSeconds: number }
}

export type RateLimitOptions = {
  /** Quantos requests por janela. */
  capacity: number
  /** Tamanho da janela em ms. */
  windowMs: number
  /** Tempo entre cleanups de buckets vencidos (default 5× windowMs). */
  cleanupIntervalMs?: number
  /** Override de "agora" pra testes. */
  now?: () => number
}

export function createRateLimiter(opts: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, Bucket>()
  const now = opts.now ?? Date.now
  const cleanupIntervalMs = opts.cleanupIntervalMs ?? opts.windowMs * 5
  let lastCleanup = now()

  function maybeCleanup(t: number) {
    if (t - lastCleanup < cleanupIntervalMs) return
    lastCleanup = t
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= t) buckets.delete(key)
    }
  }

  return {
    check(key: string) {
      const t = now()
      maybeCleanup(t)

      const bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= t) {
        buckets.set(key, { tokens: opts.capacity - 1, resetAt: t + opts.windowMs })
        return { ok: true }
      }

      if (bucket.tokens > 0) {
        bucket.tokens--
        return { ok: true }
      }

      return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - t) / 1000) }
    },
  }
}

// Resolve o IP do cliente atrás do proxy da Vercel.
// `x-forwarded-for` chega como lista; o primeiro é o cliente original.
// Fallback pra `127.0.0.1` em dev local.
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || '127.0.0.1'
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}
