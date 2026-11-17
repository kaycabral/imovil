'use client'

import { getClientAuth, getClientStorage } from '@/lib/firebase/client'
import { type PropertyImage } from '@imovil/shared'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useState } from 'react'
import { toast } from 'sonner'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function usePropertyImages({ initialImages = [] }: { initialImages?: PropertyImage[] }) {
  const [images, setImages] = useState<PropertyImage[]>(initialImages)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setImageError(null)
    const user = getClientAuth().currentUser
    if (!user) {
      setImageError('Sessão expirada — entre novamente.')
      return
    }

    const storage = getClientStorage()
    const tempId = crypto.randomUUID()
    setUploading(true)

    const uploaded: PropertyImage[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: não é uma imagem.`)
          continue
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`${file.name}: máximo 5 MB.`)
          continue
        }
        const path = `properties/${user.uid}/${tempId}/${crypto.randomUUID()}-${file.name}`
        const objectRef = ref(storage, path)
        await uploadBytes(objectRef, file)
        const src = await getDownloadURL(objectRef)
        uploaded.push({ path, src, alt: file.name })
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded])
      }
    } catch (err) {
      // Rollback: remove do Storage o que já tinha subido antes do erro.
      await Promise.all(
        uploaded.map((img) =>
          deleteObject(ref(storage, img.path)).catch((cleanupErr) =>
            console.error('[upload:rollback]', cleanupErr),
          ),
        ),
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
      await deleteObject(ref(getClientStorage(), image.path))
    } catch (err) {
      console.error(err)
    }
    setImages((prev) => prev.filter((i) => i.path !== image.path))
  }

  function clearImages() {
    const imagesToDelete = images
    setImages([])
    setImageError(null)
    imagesToDelete.forEach((img) => {
      deleteObject(ref(getClientStorage(), img.path)).catch((err) => console.error('[clear]', err))
    })
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
