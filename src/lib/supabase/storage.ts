/**
 * Public bucket for listing photos (created by the `0001_auth_storage`
 * migration in `drizzle/`, which also limits size/type and scopes writes to
 * `<auth.uid()>/…`).
 */
export const PROPERTY_IMAGES_BUCKET = 'property-images'

/** Storage key for an upload: the owner's folder + a unique, URL-safe file name. */
export function propertyImagePath(userId: string, fileName: string, id: string): string {
  const safeName =
    fileName
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(-80) || 'image'
  return `${userId}/${id}-${safeName}`
}
