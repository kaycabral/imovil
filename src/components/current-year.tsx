'use client'

/** The current year, read in the browser (a prerendered page has no request time). */
export function CurrentYear() {
  return new Date().getFullYear()
}
