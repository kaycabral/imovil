import { propertyDealSchema, propertyKindSchema, type PropertyImage } from '@imovil/shared'
import { z } from 'zod'

// Schema de validação do form (UI). Campos derivados (description array, details, broker.role/whatsappText)
// são montados no submit; o server action re-valida com o schema completo.
export const propertyFormSchema = z.object({
  kind: propertyKindSchema,
  deal: propertyDealSchema,
  title: z.string().min(3, 'Mínimo 3 caracteres.').max(120),
  subtitle: z.string().max(200),
  postalCode: z.string().regex(/^\d{8}$/, 'CEP inválido.'),
  street: z.string(),
  neighborhood: z.string().min(1, 'Informe o bairro.'),
  state: z.string().length(2, 'CEP não retornou UF.'),
  city: z.string().min(1, 'CEP não retornou cidade.'),
  price: z.number().int().positive('Maior que zero.'),
  condo: z.number().int().nonnegative(),
  iptu: z.number().int().nonnegative(),
  area: z.number().int().positive('Maior que zero.'),
  rooms: z.number().int().nonnegative(),
  suites: z.number().int().nonnegative(),
  parking: z.number().int().nonnegative(),
  floor: z.number().int().nonnegative().optional(),
  petFriendly: z.boolean(),
  furnished: z.boolean(),
  transitDistanceMin: z.number().int().nonnegative(),
  transitLabel: z.string(),
  builtYear: z.number().int().min(1900).max(2100),
  descriptionText: z.string().min(1, 'Descreva o imóvel.'),
})

export type PropertyFormValues = z.infer<typeof propertyFormSchema>

export type PostalCodeLookup = {
  postalCode: string
  state: string
  city: string
  neighborhood: string
  street: string
}

export function formatPostalCode(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export type PropertyFormProfile = {
  id: string
  phone: string | null
  creci: string | null
}

export type PropertyFormMode = 'create' | 'edit'

export type PropertyFormInitial = {
  values: PropertyFormValues
  images: PropertyImage[]
  postalCodeInput: string
  postalCodeResult: PostalCodeLookup | null
}

export const PROPERTY_FORM_DEFAULTS: PropertyFormValues = {
  kind: 'apartment',
  deal: 'rental',
  title: '',
  subtitle: '',
  postalCode: '',
  street: '',
  neighborhood: '',
  state: '',
  city: '',
  price: 0,
  condo: 0,
  iptu: 0,
  area: 0,
  rooms: 1,
  suites: 0,
  parking: 0,
  petFriendly: false,
  furnished: false,
  transitDistanceMin: 0,
  transitLabel: '',
  builtYear: new Date().getFullYear(),
  descriptionText: '',
}
