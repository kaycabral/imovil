import { describe, expect, it, vi } from 'vitest'
import { isPropertyNotFound, propertySlugFromPath } from './property-gate'

describe('propertySlugFromPath', () => {
  it('extracts the slug of a property page', () => {
    expect(propertySlugFromPath('/imoveis/casa-azul')).toBe('casa-azul')
    expect(propertySlugFromPath('/imoveis/casa-azul/')).toBe('casa-azul')
    expect(propertySlugFromPath('/imoveis/s%C3%A3o-paulo')).toBe('são-paulo')
  })

  it('ignores other paths', () => {
    expect(propertySlugFromPath('/imoveis')).toBeNull()
    expect(propertySlugFromPath('/imoveis/a/b')).toBeNull()
    expect(propertySlugFromPath('/painel/imoveis/x')).toBeNull()
    expect(propertySlugFromPath('/imoveis/%E0%A4%A')).toBeNull()
  })
})

const owner = 'owner-1'
const viewer = (id: string | null) => () => Promise.resolve(id)
const found = (status: 'published' | 'draft' | 'paused') => () =>
  Promise.resolve({ status, ownerId: owner })

describe('isPropertyNotFound', () => {
  it('is 404 for an unknown slug', async () => {
    const lookup = () => Promise.resolve(null)
    expect(await isPropertyNotFound('x', { lookup, viewerId: viewer(null) })).toBe(true)
  })

  it('lets published properties through without reading the session', async () => {
    const viewerId = vi.fn(viewer(null))
    expect(await isPropertyNotFound('x', { lookup: found('published'), viewerId })).toBe(false)
    expect(viewerId).not.toHaveBeenCalled()
  })

  it('hides drafts and paused properties from everyone but the owner', async () => {
    for (const status of ['draft', 'paused'] as const) {
      const lookup = found(status)
      expect(await isPropertyNotFound('x', { lookup, viewerId: viewer(null) })).toBe(true)
      expect(await isPropertyNotFound('x', { lookup, viewerId: viewer('other') })).toBe(true)
      expect(await isPropertyNotFound('x', { lookup, viewerId: viewer(owner) })).toBe(false)
    }
  })

  it('falls through when the lookup fails or hangs', async () => {
    const failing = () => Promise.reject(new Error('down'))
    expect(await isPropertyNotFound('x', { lookup: failing, viewerId: viewer(null) })).toBe(false)
    const hanging = () => new Promise<null>(() => {})
    const deps = { lookup: hanging, viewerId: viewer(null), timeoutMs: 5 }
    expect(await isPropertyNotFound('x', deps)).toBe(false)
  })
})
