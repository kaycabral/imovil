// Pure mapping from the property form values to the create/update payload,
// extracted from the 'use client' component so the description parsing and the
// values→payload assembly are importable + unit-tested. No React, no I/O.

import { type PropertyCreateInput, type PropertyImage } from '@imovil/shared'
import { type PropertyFormValues } from './property-form-schema'

// Split the free-text description into paragraph blocks: separated by one or
// more blank lines, trimmed, empties dropped. An all-blank input yields [].
export function parseDescription(descriptionText: string): string[] {
  return descriptionText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

// Assemble the persisted payload from the validated form values + the uploaded
// images + the parsed description blocks. Field-for-field — no derivation beyond
// what the caller already computed.
export function buildPropertyPayload(
  values: PropertyFormValues,
  images: PropertyImage[],
  description: string[],
): PropertyCreateInput {
  return {
    kind: values.kind,
    deal: values.deal,
    title: values.title,
    subtitle: values.subtitle,
    postalCode: values.postalCode,
    street: values.street,
    neighborhood: values.neighborhood,
    city: values.city,
    state: values.state,
    price: values.price,
    condo: values.condo,
    iptu: values.iptu,
    area: values.area,
    rooms: values.rooms,
    suites: values.suites,
    parking: values.parking,
    floor: values.floor,
    petFriendly: values.petFriendly,
    furnished: values.furnished,
    transitDistanceMin: values.transitDistanceMin,
    transitLabel: values.transitLabel,
    builtYear: values.builtYear,
    description,
    details: [],
    images,
  }
}
