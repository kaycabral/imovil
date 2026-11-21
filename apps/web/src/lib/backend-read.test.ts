import { afterEach, describe, expect, it, vi } from 'vitest'
import { readBackend } from './backend-read'

const logError = vi.hoisted(() => vi.fn<(message: string, meta?: object) => void>())
vi.mock('@cbrl/log', () => ({ logger: { error: logError } }))

describe('readBackend', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('returns the data when the read resolves', async () => {
    await expect(readBackend('ok', () => Promise.resolve(42))).resolves.toEqual({
      ok: true,
      data: 42,
    })
  })

  it('degrades when the read rejects', async () => {
    const result = await readBackend('rejects', () => Promise.reject(new Error('boom')))
    expect(result).toEqual({ ok: false })
    expect(logError).toHaveBeenCalledWith(
      'backend read unavailable',
      expect.objectContaining({ read: 'rejects' }),
    )
  })

  it('degrades when the read throws synchronously', async () => {
    const result = await readBackend('throws', () => {
      throw new Error('missing env')
    })
    expect(result).toEqual({ ok: false })
  })

  it('degrades when the read hangs past the timeout', async () => {
    vi.useFakeTimers()
    const pending = readBackend('hangs', () => new Promise<never>(() => undefined), 1_000)
    await vi.advanceTimersByTimeAsync(1_000)
    await expect(pending).resolves.toEqual({ ok: false })
  })
})
