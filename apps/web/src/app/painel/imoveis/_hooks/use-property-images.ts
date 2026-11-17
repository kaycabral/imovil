'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { PROPERTY_IMAGES_BUCKET, propertyImagePath } from '@/lib/supabase/storage'
import { type PropertyImage } from '@imovil/shared'
import { useState } from 'react'
import { toast } from 'sonner'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function removeFromStorage(paths: string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase || paths.length === 0) return Promise.resolve()
  return supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove(paths)
    .then(({ error }) => {
      if (error) throw error
    })
}

export function usePropertyImages({ initialImages = [] }: { initialImages?: PropertyImage[] }) {
  const [images, setImages] = useState<PropertyImage[]>(initialImages)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    // Snapshot before any await: the input's FileList is live and the caller
    // resets the input right after this call, emptying it.
    const selected = Array.from(files)
    setImageError(null)
    const supabase = getSupabaseBrowserClient()
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
    const userId = data.session?.user.id
    if (!supabase || !userId) {
      setImageError('Sessão expirada — entre novamente.')
      return
    }

    const bucket = supabase.storage.from(PROPERTY_IMAGES_BUCKET)
    setUploading(true)

    const uploaded: PropertyImage[] = []
    try {
      for (const file of selected) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: não é uma imagem.`)
          continue
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`${file.name}: máximo 5 MB.`)
          continue
        }
        const path = propertyImagePath(userId, file.name, crypto.randomUUID())
        const { error } = await bucket.upload(path, file, { contentType: file.type })
        if (error) throw error
        uploaded.push({ path, src: bucket.getPublicUrl(path).data.publicUrl, alt: file.name })
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded])
      }
    } catch (err) {
      // Rollback: remove do Storage o que já tinha subido antes do erro.
      await removeFromStorage(uploaded.map((img) => img.path)).catch((cleanupErr: unknown) =>
        console.error('[upload:rollback]', cleanupErr),
      )
      console.error('[upload]', err)
      const message =
        err instanceof Error && err.message ? err.message : 'Falha no upload. Tente novamente.'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  async function removeImage(image: PropertyImage) {
    try {
      await removeFromStorage([image.path])
    } catch (err) {
      console.error(err)
    }
    setImages((prev) => prev.filter((i) => i.path !== image.path))
  }

  function clearImages() {
    const imagesToDelete = images
    setImages([])
    setImageError(null)
    removeFromStorage(imagesToDelete.map((img) => img.path)).catch((err: unknown) =>
      console.error('[clear]', err),
    )
  }

  return {
    images,
    setImages,
    imageError,
    setImageError,
    uploading,
    handleFiles,
    removeImage,
    clearImages,
  }
}
