import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import manifest from './manifest'

const og = vi.hoisted(() => ({
  calls: [] as { element: React.ReactElement; init: unknown }[],
}))

vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(element: React.ReactElement, init: unknown) {
      og.calls.push({ element, init })
    }
  },
}))

describe('brand assets', () => {
  it('manifest names the app and ships the install icons', () => {
    const m = manifest()
    expect(m.name).toBe('Imovil')
    expect(m.start_url).toBe('/imoveis')
    expect(m.icons?.map((i) => i.purpose)).toEqual(['any', 'any', 'maskable'])
  })

  it('share image renders the icon and name at 1200x630', async () => {
    const mod = await import('./opengraph-image')
    await mod.default()
    const [call] = og.calls
    expect(call?.init).toEqual({ width: 1200, height: 630 })
    expect(mod.alt).toMatch(/^Imovil — /)
    render(call?.element)
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/svg\+xml;base64,/),
    )
    expect(screen.getByText('Imovil')).toBeInTheDocument()
  })
})
