import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readBackend } from './backend-read'

describe('readBackend', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
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
    expect(console.error).toHaveBeenCalledWith('[backend] rejects unavailable:', expect.any(Error))
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
