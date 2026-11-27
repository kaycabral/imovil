import { describe, expect, it } from 'vitest'
import { siteUrl } from './site-url'

describe('siteUrl', () => {
  it('uses the Vercel production host over https', () => {
    expect(siteUrl('app.example.com').href).toBe('https://app.example.com/')
  })

  it('falls back to localhost outside Vercel', () => {
    expect(siteUrl('').href).toBe('http://localhost:3000/')
  })
})
