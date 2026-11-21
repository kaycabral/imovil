import type { PostalCodeAddress } from '@cbrl/br/postal-code'
import { type PropertyImage } from '@imovil/shared'
import { type PropertyFormValues } from '../_data/property-form-schema'

export const DRAFT_KEY_PREFIX = 'property-form:draft:'

// Rascunhos contêm PII (endereço completo + preço de imóvel ainda não publicado).
// TTL curto reduz risco em máquina compartilhada — broker que esqueceu de fazer
// logout não deixa o rascunho disponível indefinidamente pro próximo usuário local.
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type PersistedDraft = {
  values: PropertyFormValues
  images: PropertyImage[]
  postalCodeInput: string
  postalCodeResult: PostalCodeAddress | null
  savedAt: number
}

function isPersistedDraft(value: unknown): value is PersistedDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    'savedAt' in value &&
    typeof value.savedAt === 'number'
  )
}

export function readDraft(uid: string, now: number = Date.now()): PersistedDraft | null {
  if (typeof window === 'undefined' || !uid) return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + uid)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedDraft(parsed) || now - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(DRAFT_KEY_PREFIX + uid)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeDraft(uid: string, draft: Omit<PersistedDraft, 'savedAt'>): void {
  if (typeof window === 'undefined' || !uid) return
  const payload: PersistedDraft = { ...draft, savedAt: Date.now() }
  window.localStorage.setItem(DRAFT_KEY_PREFIX + uid, JSON.stringify(payload))
}

export function removeDraft(uid: string): void {
  if (typeof window === 'undefined' || !uid) return
  window.localStorage.removeItem(DRAFT_KEY_PREFIX + uid)
}

// LGPD: ao fazer logout, limpa todos os rascunhos do disco. Cobre o caso da
// máquina compartilhada — próximo usuário local não vê endereço/preço de imóvel
// rascunhado pelo anterior.
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key && key.startsWith(DRAFT_KEY_PREFIX)) keys.push(key)
  }
  for (const key of keys) window.localStorage.removeItem(key)
}
