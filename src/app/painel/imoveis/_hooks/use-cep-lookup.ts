'use client'

import type { PostalCodeAddress } from '@cbrl/br/postal-code'
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useState,
} from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { type PropertyFormValues } from '../_data/property-form-schema'

const errorBodySchema = z.object({ error: z.string().optional() }).catch({})
const postalCodeLookupSchema = z.object({
  postalCode: z.string(),
  state: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
}) satisfies z.ZodType<PostalCodeAddress>

export function useCepLookup({
  postalCodeDigits,
  draftHydrated,
  draftRestored,
  form,
  setPostalCodeResult,
}: {
  postalCodeDigits: string
  draftHydrated: boolean
  draftRestored: MutableRefObject<boolean>
  form: UseFormReturn<PropertyFormValues>
  setPostalCodeResult: Dispatch<SetStateAction<PostalCodeAddress | null>>
}) {
  const [lookingUpPostalCode, setLookingUpPostalCode] = useState(false)

  useEffect(() => {
    // Espera o rascunho hidratar antes de reagir — senão a gente limparia campos restaurados.
    if (!draftHydrated) return
    if (postalCodeDigits.length !== 8) {
      setPostalCodeResult(null)
      form.setValue('postalCode', '')
      form.setValue('state', '')
      form.setValue('city', '')
      form.setValue('neighborhood', '')
      form.setValue('street', '')
      return
    }
    // Se veio do rascunho com CEP já resolvido, não refaz o fetch — os campos já estão certos.
    if (draftRestored.current) {
      draftRestored.current = false
      return
    }

    let cancelled = false
    setLookingUpPostalCode(true)
    fetch(`/api/postal-code/${postalCodeDigits}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = errorBodySchema.parse(await r.json().catch(() => ({})))
          throw new Error(
            body.error ?? `CEP lookup failed: cep=${postalCodeDigits} status=${r.status}`,
          )
        }
        return postalCodeLookupSchema.parse(await r.json())
      })
      .then((data) => {
        if (cancelled) return
        setPostalCodeResult(data)
        form.setValue('postalCode', data.postalCode.replace(/\D/g, ''), { shouldValidate: true })
        form.setValue('state', data.state, { shouldValidate: true })
        form.setValue('city', data.city, { shouldValidate: true })
        form.setValue('neighborhood', data.neighborhood, { shouldValidate: true })
        form.setValue('street', data.street)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setPostalCodeResult(null)
        toast.error(err.message)
      })
      .finally(() => {
        if (!cancelled) setLookingUpPostalCode(false)
      })
    return () => {
      cancelled = true
    }
  }, [postalCodeDigits, form, draftHydrated, draftRestored, setPostalCodeResult])

  return { lookingUpPostalCode }
}
