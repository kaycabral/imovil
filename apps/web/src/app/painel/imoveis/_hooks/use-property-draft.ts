'use client'

import { type PropertyImage } from '@imovil/shared'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import {
  PROPERTY_FORM_DEFAULTS,
  type PostalCodeLookup,
  type PropertyFormInitial,
  type PropertyFormValues,
} from '../_data/property-form-schema'
import { readDraft, removeDraft, writeDraft } from './property-draft-storage'

// Lista explícita das chaves do form, tipada como tupla. `satisfies` força completude
// em compile-time (faltar uma chave = erro de tipo) sem precisar de assertion sobre o
// retorno widened de Object.keys — cada elemento é literalmente uma `keyof PropertyFormValues`.
const PROPERTY_FORM_KEYS = [
  'kind',
  'deal',
  'title',
  'subtitle',
  'postalCode',
  'street',
  'neighborhood',
  'state',
  'city',
  'price',
  'condo',
  'iptu',
  'area',
  'rooms',
  'suites',
  'parking',
  'floor',
  'petFriendly',
  'furnished',
  'transitDistanceMin',
  'transitLabel',
  'builtYear',
  'descriptionText',
] as const satisfies readonly (keyof PropertyFormValues)[]

// Garante exaustividade em compile-time: se uma chave nova entrar em PropertyFormValues
// e não for listada acima, `MissingKey` deixa de ser `never` e a atribuição quebra o build.
type MissingKey = Exclude<keyof PropertyFormValues, (typeof PROPERTY_FORM_KEYS)[number]>
const _assertAllKeysListed: MissingKey extends never ? true : never = true
void _assertAllKeysListed

function isDraftEmpty(
  values: PropertyFormValues,
  images: PropertyImage[],
  postalCodeInput: string,
  postalCodeResult: PostalCodeLookup | null,
): boolean {
  if (images.length !== 0 || postalCodeInput !== '' || postalCodeResult !== null) return false
  return PROPERTY_FORM_KEYS.every((key) => values[key] === PROPERTY_FORM_DEFAULTS[key])
}

export function usePropertyDraft({
  uid,
  isEdit,
  initial,
  form,
  images,
  setImages,
  postalCodeInput,
  setPostalCodeInput,
  postalCodeResult,
  setPostalCodeResult,
}: {
  uid: string
  isEdit: boolean
  initial: PropertyFormInitial | undefined
  form: UseFormReturn<PropertyFormValues>
  images: PropertyImage[]
  setImages: Dispatch<SetStateAction<PropertyImage[]>>
  postalCodeInput: string
  setPostalCodeInput: Dispatch<SetStateAction<string>>
  postalCodeResult: PostalCodeLookup | null
  setPostalCodeResult: Dispatch<SetStateAction<PostalCodeLookup | null>>
}) {
  const draftRestored = useRef(false)
  const [draftHydrated, setDraftHydrated] = useState(isEdit)

  // Em edit a hidratação vem via props (já passada em defaultValues e useState initializers).
  // Em create, tentamos restaurar rascunho do localStorage após montagem — evita SSR mismatch.
  useEffect(() => {
    if (isEdit) {
      // Edit mode: marca skip pro effect do CEP (já temos os dados do endereço prontos).
      if (initial?.postalCodeInput && initial.postalCodeInput.replace(/\D/g, '').length === 8) {
        draftRestored.current = true
      }
      return
    }
    const draft = readDraft(uid)
    if (draft) {
      draftRestored.current = true
      form.reset(draft.values)
      setImages(draft.images)
      setPostalCodeInput(draft.postalCodeInput)
      setPostalCodeResult(draft.postalCodeResult)
    }
    setDraftHydrated(true)
  }, [uid, form, isEdit, initial, setImages, setPostalCodeInput, setPostalCodeResult])

  // Persiste o rascunho em localStorage a cada mudança — evita perder o preenchido em reload ou navegação.
  // Apenas em create: em edit a fonte de verdade é o banco e não faz sentido guardar rascunho.
  // PII: o rascunho contém endereço completo + preço; ttl + clearAllDrafts no logout
  // protegem contra leak em máquina compartilhada (ver property-draft-storage.ts).
  useEffect(() => {
    if (isEdit || !draftHydrated || !uid) return
    const sub = form.watch(() => {
      const values = form.getValues()
      if (isDraftEmpty(values, images, postalCodeInput, postalCodeResult)) {
        removeDraft(uid)
        return
      }
      writeDraft(uid, {
        values,
        images,
        postalCodeInput,
        postalCodeResult,
      })
    })
    return () => sub.unsubscribe()
  }, [form, images, postalCodeInput, postalCodeResult, uid, draftHydrated, isEdit])

  useEffect(() => {
    if (isEdit || !draftHydrated || !uid) return
    const values = form.getValues()
    if (isDraftEmpty(values, images, postalCodeInput, postalCodeResult)) {
      removeDraft(uid)
      return
    }
    writeDraft(uid, { values, images, postalCodeInput, postalCodeResult })
  }, [images, postalCodeInput, postalCodeResult, form, uid, draftHydrated, isEdit])

  function clearDraft() {
    removeDraft(uid)
  }

  return { draftHydrated, draftRestored, clearDraft }
}
