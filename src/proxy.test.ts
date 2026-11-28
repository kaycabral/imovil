import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  claims: vi.fn(),
}))

vi.mock('@/db/queries/properties', () => ({ getPropertyVisibility: mocks.lookup }))
vi.mock('@cbrl/supabase/proxy', () => ({
  updateSession: () => {
    const response = NextResponse.next()
    response.cookies.set('sb-token', 'rotated')
    return Promise.resolve(response)
  },
}))
vi.mock('@cbrl/supabase', () => ({
  supabasePublicConfig: () => ({ url: 'http://supabase.test', key: 'anon' }),
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getClaims: mocks.claims } }),
}))

const { proxy } = await import('./proxy')

const request = (path: string) => new NextRequest(new URL(path, 'http://imovil.test'))

describe('proxy', () => {
  beforeEach(() => {
    mocks.lookup.mockReset()
    mocks.claims.mockReset().mockResolvedValue({ data: null })
  })

  it('only refreshes the session outside property pages', async () => {
    const response = await proxy(request('/painel'))
    expect(response.status).toBe(200)
    expect(mocks.lookup).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown slug, keeping rotated cookies', async () => {
    mocks.lookup.mockResolvedValue(null)
    const response = await proxy(request('/imoveis/nao-existe'))
    expect(response.status).toBe(404)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/_not-found')
    expect(response.cookies.get('sb-token')?.value).toBe('rotated')
  })

  it('lets a published property through', async () => {
    mocks.lookup.mockResolvedValue({ status: 'published', ownerId: 'u1' })
    expect((await proxy(request('/imoveis/casa'))).status).toBe(200)
    expect(mocks.claims).not.toHaveBeenCalled()
  })

  it('shows a draft only to its owner', async () => {
    mocks.lookup.mockResolvedValue({ status: 'draft', ownerId: 'u1' })
    expect((await proxy(request('/imoveis/casa'))).status).toBe(404)
    mocks.claims.mockResolvedValue({ data: { claims: { sub: 'u1' } } })
    expect((await proxy(request('/imoveis/casa'))).status).toBe(200)
  })
})
