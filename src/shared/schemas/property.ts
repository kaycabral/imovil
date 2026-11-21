import { z } from 'zod'

export const propertyKindSchema = z.enum(['apartment', 'studio', 'kitnet', 'house'])
export const propertyDealSchema = z.enum(['rental', 'sale'])
export const propertyStatusSchema = z.enum(['published', 'draft', 'paused'])
export const propertyImageSpanSchema = z.enum(['wide', 'tall', 'square'])

export const propertyImageSchema = z.object({
  path: z.string().min(1),
  src: z.string().url(),
  alt: z.string(),
  span: propertyImageSpanSchema.optional(),
})

export const propertyDetailSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

export const propertyCreateSchema = z.object({
  kind: propertyKindSchema,
  deal: propertyDealSchema,
  title: z.string().min(3).max(120),
  subtitle: z.string().max(200).default(''),
  postalCode: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos.'),
  street: z.string().default(''),
  neighborhood: z.string().min(1, 'Informe o bairro.'),
  city: z.string().min(1),
  state: z.string().length(2, 'UF inválida.'),
  price: z.number().int().positive(),
  condo: z.number().int().nonnegative().default(0),
  iptu: z.number().int().nonnegative().default(0),
  area: z.number().int().positive(),
  rooms: z.number().int().nonnegative(),
  suites: z.number().int().nonnegative().default(0),
  parking: z.number().int().nonnegative().default(0),
  floor: z.number().int().nonnegative().optional(),
  petFriendly: z.boolean().default(false),
  furnished: z.boolean().default(false),
  transitDistanceMin: z.number().int().nonnegative().default(0),
  transitLabel: z.string().default(''),
  builtYear: z.number().int().min(1900).max(2100),
  description: z.array(z.string().min(1)).min(1),
  details: z.array(propertyDetailSchema).default([]),
  images: z.array(propertyImageSchema).min(1, { message: 'Envie ao menos 1 imagem.' }),
})

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>
