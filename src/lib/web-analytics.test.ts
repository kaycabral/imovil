import { describe, expect, it } from 'vitest'
import { redactAnalyticsEvent, redactAnalyticsUrl } from './web-analytics'

const ORIGIN = 'https://imovil.example'

describe('redactAnalyticsUrl', () => {
  it('drops the query string and the fragment', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/imoveis?bairro=centro&pet=1#mapa`)).toBe(
      `${ORIGIN}/imoveis`,
    )
  })

  it('drops the OAuth code from the auth callback', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/auth/callback?code=abc&next=%2Fpainel`)).toBe(
      `${ORIGIN}/auth/callback`,
    )
  })

  it('redacts the property id in the broker panel, nested paths included', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/painel/imoveis/7f3c/editar`)).toBe(
      `${ORIGIN}/painel/imoveis/[id]/editar`,
    )
  })

  it('keeps the static panel routes', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/painel/imoveis/novo`)).toBe(
      `${ORIGIN}/painel/imoveis/novo`,
    )
    expect(redactAnalyticsUrl(`${ORIGIN}/painel/imoveis`)).toBe(`${ORIGIN}/painel/imoveis`)
  })

  it('keeps public listing slugs', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/imoveis/apartamento-centro-2q`)).toBe(
      `${ORIGIN}/imoveis/apartamento-centro-2q`,
    )
  })

  it('returns null for an unparseable url', () => {
    expect(redactAnalyticsUrl('not a url')).toBeNull()
  })
})

describe('redactAnalyticsEvent', () => {
  it('rewrites the url and keeps the event type', () => {
    expect(
      redactAnalyticsEvent({ type: 'pageview', url: `${ORIGIN}/painel/imoveis/7f3c/editar?x=1` }),
    ).toEqual({ type: 'pageview', url: `${ORIGIN}/painel/imoveis/[id]/editar` })
  })

  it('drops the event when the url cannot be parsed', () => {
    expect(redactAnalyticsEvent({ type: 'event', url: '::' })).toBeNull()
  })
})
