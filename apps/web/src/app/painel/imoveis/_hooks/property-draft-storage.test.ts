import type { PropertyImage } from '@tekoa/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostalCodeLookup, PropertyFormValues } from '../_data/property-form-schema'
import {
  DRAFT_KEY_PREFIX,
  DRAFT_TTL_MS,
  clearAllDrafts,
  readDraft,
  removeDraft,
  writeDraft,
} from './property-draft-storage'

const fakeValues: PropertyFormValues = {
  kind: 'apartment',
  deal: 'sale',
  title: 'Casa de teste',
  subtitle: '',
  postalCode: '01310100',
  street: '',
  neighborhood: 'Centro',
  state: 'SP',
  city: 'São Paulo',
  price: 1,
  condo: 0,
  iptu: 0,
  area: 1,
  rooms: 0,
  suites: 0,
  parking: 0,
  petFriendly: false,
  furnished: false,
  transitDistanceMin: 0,
  transitLabel: '',
  builtYear: 2000,
  descriptionText: 'Imóvel de teste',
}
const fakeImages: PropertyImage[] = []
const fakePostalCodeInput = '01310-100'
const fakePostalCodeResult: PostalCodeLookup | null = null

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('writeDraft', () => {
  it('grava o rascunho com savedAt timestamp', () => {
    writeDraft('uid-1', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })

    const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-1')
    expect(raw).not.toBeNull()
    const parsed: unknown = JSON.parse(raw!)
    expect(parsed).toMatchObject({ values: fakeValues })
    expect(parsed).toMatchObject({ savedAt: expect.any(Number) as unknown })
  })

  it('é no-op quando uid é vazio', () => {
    writeDraft('', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })
    expect(window.localStorage.length).toBe(0)
  })
})

describe('readDraft', () => {
  it('retorna null quando não há rascunho', () => {
    expect(readDraft('uid-1')).toBeNull()
  })

  it('retorna o rascunho quando dentro do TTL', () => {
    writeDraft('uid-1', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })
    const draft = readDraft('uid-1')
    expect(draft?.values).toEqual(fakeValues)
  })

  it('descarta e remove rascunho expirado (savedAt > 7 dias)', () => {
    const oldTimestamp = Date.now() - DRAFT_TTL_MS - 1000
    window.localStorage.setItem(
      DRAFT_KEY_PREFIX + 'uid-1',
      JSON.stringify({
        values: fakeValues,
        images: fakeImages,
        postalCodeInput: fakePostalCodeInput,
        postalCodeResult: fakePostalCodeResult,
        savedAt: oldTimestamp,
      }),
    )

    expect(readDraft('uid-1')).toBeNull()
    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-1')).toBeNull()
  })

  it('descarta rascunho sem savedAt (formato antigo pre-TTL)', () => {
    window.localStorage.setItem(
      DRAFT_KEY_PREFIX + 'uid-1',
      JSON.stringify({
        values: fakeValues,
        images: fakeImages,
        postalCodeInput: fakePostalCodeInput,
        postalCodeResult: fakePostalCodeResult,
      }),
    )

    expect(readDraft('uid-1')).toBeNull()
    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-1')).toBeNull()
  })

  it('retorna null se JSON corrompido', () => {
    window.localStorage.setItem(DRAFT_KEY_PREFIX + 'uid-1', 'not-json{')
    expect(readDraft('uid-1')).toBeNull()
  })
})

describe('removeDraft', () => {
  it('remove só o rascunho do uid passado', () => {
    writeDraft('uid-1', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })
    writeDraft('uid-2', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })

    removeDraft('uid-1')

    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-1')).toBeNull()
    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-2')).not.toBeNull()
  })
})

describe('clearAllDrafts', () => {
  it('remove todos os rascunhos com prefixo conhecido', () => {
    writeDraft('uid-1', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })
    writeDraft('uid-2', {
      values: fakeValues,
      images: fakeImages,
      postalCodeInput: fakePostalCodeInput,
      postalCodeResult: fakePostalCodeResult,
    })
    window.localStorage.setItem('outra-coisa:keep-me', 'preservado')

    clearAllDrafts()

    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-1')).toBeNull()
    expect(window.localStorage.getItem(DRAFT_KEY_PREFIX + 'uid-2')).toBeNull()
    expect(window.localStorage.getItem('outra-coisa:keep-me')).toBe('preservado')
  })

  it('é no-op quando localStorage está vazio', () => {
    expect(() => clearAllDrafts()).not.toThrow()
  })
})
