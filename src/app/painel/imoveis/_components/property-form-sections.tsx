'use client'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { propertyKindLabels, type PropertyImage } from '@/shared'
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@cbrl/design'
import { Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { type UseFormReturn } from 'react-hook-form'
import { type PropertyFormValues } from '../_data/property-form-schema'
import { Section } from './property-form-fields'

// "Anúncio" section — modalidade/tipo selects + title/subtitle/description text
// fields, all bound to the shared react-hook-form control.
export function PropertyAdSection({ form }: { form: UseFormReturn<PropertyFormValues> }) {
  return (
    <Section title="Anúncio">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)]">
        <FormField
          control={form.control}
          name="deal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidade</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rental">Aluguel</SelectItem>
                  <SelectItem value="sale">Venda</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="apartment">{propertyKindLabels.apartment}</SelectItem>
                  <SelectItem value="studio">{propertyKindLabels.studio}</SelectItem>
                  <SelectItem value="kitnet">{propertyKindLabels.kitnet}</SelectItem>
                  <SelectItem value="house">{propertyKindLabels.house}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input placeholder="Apartamento de 2 quartos em…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtítulo</FormLabel>
            <FormControl>
              <Input placeholder="58 m², reformado em 2023, aceita pet…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="descriptionText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea
                rows={8}
                placeholder={
                  'Um parágrafo por bloco, separados por linha em branco.\n\nOutro parágrafo aqui.'
                }
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Section>
  )
}

// "Imagens" section — dropzone empty-state + uploaded grid with per-image
// remove. All image state is owned by the parent (usePropertyImages).
export function PropertyImagesSection({
  images,
  uploading,
  imageError,
  handleFiles,
  removeImage,
}: {
  images: PropertyImage[]
  uploading: boolean
  imageError: string | null
  handleFiles: (files: FileList | null) => void | Promise<void>
  removeImage: (image: PropertyImage) => void | Promise<void>
}) {
  return (
    <Section title="Imagens">
      <div className="flex flex-col gap-3">
        {images.length === 0 ? (
          <label className="border-border hover:border-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm transition-colors">
            {uploading ? (
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            ) : (
              <Upload className="text-muted-foreground size-5" />
            )}
            <span className="text-muted-foreground">
              {uploading ? 'Enviando…' : 'Clique ou arraste imagens aqui (máx. 5 MB cada)'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="Adicionar imagens"
              disabled={uploading}
              onChange={(e) => {
                void handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.path}
                className="bg-muted relative aspect-square overflow-hidden rounded-lg"
              >
                <Image src={img.src} alt={img.alt} fill sizes="150px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => void removeImage(img)}
                  className="bg-background/90 text-foreground hover:bg-destructive hover:text-destructive-foreground absolute top-1.5 right-1.5 rounded-full p-1.5 transition-colors"
                  aria-label="Remover imagem"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <label className="border-border hover:border-primary text-muted-foreground flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-3 text-center text-xs transition-colors">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Upload className="size-5" />
              )}
              <span>{uploading ? 'Enviando…' : 'Adicionar'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        )}
        {imageError && <p className="text-destructive text-sm">{imageError}</p>}
      </div>
    </Section>
  )
}
