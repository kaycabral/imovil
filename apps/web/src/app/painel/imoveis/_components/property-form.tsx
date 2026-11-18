'use client'

import { updateBrokerProfile } from '@/app/actions/profile'
import { createProperty, updateProperty } from '@/app/actions/properties'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button, Input, Skeleton } from '@cbrl/design'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  PROPERTY_FORM_DEFAULTS,
  formatPostalCode,
  propertyFormSchema,
  type PostalCodeLookup,
  type PropertyFormInitial,
  type PropertyFormMode,
  type PropertyFormProfile,
  type PropertyFormValues,
} from '../_data/property-form-schema'
import { buildPropertyPayload, parseDescription } from '../_data/property-payload'
import { useCepLookup } from '../_hooks/use-cep-lookup'
import { usePropertyDraft } from '../_hooks/use-property-draft'
import { usePropertyImages } from '../_hooks/use-property-images'
import { BrokerContactDialog } from './broker-contact-dialog'
import { MoneyField, NumberField, Section, SwitchField } from './property-form-fields'
import { PropertyAdSection, PropertyImagesSection } from './property-form-sections'

export type { PropertyFormInitial, PropertyFormMode, PropertyFormProfile }

export function PropertyForm({
  profile,
  mode = 'create',
  propertyId,
  initial,
}: {
  profile: PropertyFormProfile
  mode?: PropertyFormMode
  propertyId?: string
  initial?: PropertyFormInitial
}) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const {
    images,
    setImages,
    imageError,
    setImageError,
    uploading,
    handleFiles,
    removeImage,
    clearImages,
  } = usePropertyImages({ initialImages: initial?.images })
  const [submitting, startTransition] = useTransition()
  const [postalCodeInput, setPostalCodeInput] = useState(() => initial?.postalCodeInput ?? '')
  const [postalCodeResult, setPostalCodeResult] = useState<PostalCodeLookup | null>(
    () => initial?.postalCodeResult ?? null,
  )
  const [phone, setPhone] = useState<string | null>(profile.phone)
  const [creci, setCreci] = useState<string | null>(profile.creci)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const pendingValues = useRef<PropertyFormValues | null>(null)

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initial?.values ?? PROPERTY_FORM_DEFAULTS,
  })

  const { draftHydrated, draftRestored, clearDraft } = usePropertyDraft({
    uid: profile.id,
    isEdit,
    initial,
    form,
    images,
    setImages,
    postalCodeInput,
    setPostalCodeInput,
    postalCodeResult,
    setPostalCodeResult,
  })

  const postalCodeDigits = postalCodeInput.replace(/\D/g, '')

  const { lookingUpPostalCode } = useCepLookup({
    postalCodeDigits,
    draftHydrated,
    draftRestored,
    form,
    setPostalCodeResult,
  })

  function submitProperty(values: PropertyFormValues) {
    const description = parseDescription(values.descriptionText)
    if (description.length === 0) {
      form.setError('descriptionText', { message: 'Descreva o imóvel.' })
      return
    }

    const payload = buildPropertyPayload(values, images, description)

    startTransition(async () => {
      const result =
        isEdit && propertyId
          ? await updateProperty(propertyId, payload)
          : await createProperty(payload)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (!isEdit) {
        clearDraft()
      }
      toast.success(isEdit ? 'Alterações salvas.' : 'Imóvel criado como rascunho.')
      router.push('/painel/imoveis')
      router.refresh()
    })
  }

  function handleClear() {
    if (!window.confirm('Limpar todo o rascunho? Essa ação não pode ser desfeita.')) return
    form.reset(PROPERTY_FORM_DEFAULTS)
    setPostalCodeInput('')
    setPostalCodeResult(null)
    clearImages()
    clearDraft()
  }

  function onSubmit(values: PropertyFormValues) {
    if (images.length === 0) {
      setImageError('Envie ao menos 1 imagem.')
      return
    }
    setImageError(null)

    if (!phone || !creci) {
      pendingValues.current = values
      setPhoneDialogOpen(true)
      return
    }

    submitProperty(values)
  }

  async function handlePhoneSubmit(newPhone: string, newCreci: string) {
    const result = await updateBrokerProfile({ phone: newPhone, creci: newCreci })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setPhone(newPhone)
    setCreci(newCreci)
    setPhoneDialogOpen(false)

    const pending = pendingValues.current
    pendingValues.current = null
    if (pending) submitProperty(pending)
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-6">
        {!isEdit && draftRestored.current && (
          <p
            role="status"
            className="text-muted-foreground text-xs"
            title="O rascunho fica salvo localmente neste navegador por até 7 dias e é apagado automaticamente quando você sai da conta."
          >
            Rascunho restaurado deste navegador.
          </p>
        )}
        <PropertyAdSection form={form} />

        <Section title="Localização">
          <FormField
            control={form.control}
            name="postalCode"
            render={() => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    placeholder="00000-000"
                    maxLength={9}
                    className="md:max-w-[240px]"
                    value={postalCodeInput}
                    onChange={(e) => setPostalCodeInput(formatPostalCode(e.target.value))}
                    disabled={lookingUpPostalCode}
                  />
                </FormControl>
                {!postalCodeResult && !lookingUpPostalCode && (
                  <FormDescription>
                    Preenchemos rua, bairro, cidade e estado automaticamente.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {lookingUpPostalCode && (
            <div className="md:max-w-[420px]">
              <AddressSkeleton />
            </div>
          )}
          {postalCodeResult && !lookingUpPostalCode && (
            <div className="md:max-w-[420px]">
              <AddressSummary data={postalCodeResult} />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_minmax(0,220px)]">
            <FormField
              control={form.control}
              name="transitLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência de transporte</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Djalma Batista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <NumberField form={form} name="transitDistanceMin" label="Distância (min a pé)" />
          </div>
        </Section>

        <Section title="Valores e detalhes">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MoneyField
              form={form}
              name="price"
              label={form.watch('deal') === 'sale' ? 'Valor de venda' : 'Valor do aluguel'}
            />
            <MoneyField form={form} name="condo" label="Condomínio" />
            <MoneyField form={form} name="iptu" label="IPTU" />
            <NumberField form={form} name="area" label="Área (m²)" />
            <NumberField form={form} name="rooms" label="Quartos" />
            <NumberField form={form} name="suites" label="Suítes" />
            <NumberField form={form} name="parking" label="Vagas" />
            <NumberField form={form} name="floor" label="Andar" optional />
            <NumberField form={form} name="builtYear" label="Ano de construção" />
          </div>
        </Section>

        <Section title="Características">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SwitchField form={form} name="petFriendly" label="Aceita pet" />
            <SwitchField form={form} name="furnished" label="Mobiliado" />
          </div>
        </Section>

        <PropertyImagesSection
          images={images}
          uploading={uploading}
          imageError={imageError}
          handleFiles={handleFiles}
          removeImage={removeImage}
        />

        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          {isEdit ? (
            <div />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              disabled={submitting || uploading}
              className="text-muted-foreground"
            >
              Limpar rascunho
            </Button>
          )}
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/painel/imoveis')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Salvar alterações' : 'Salvar como rascunho'}
            </Button>
          </div>
        </div>
      </form>
      <BrokerContactDialog
        open={phoneDialogOpen}
        onOpenChange={(next) => {
          if (!next) pendingValues.current = null
          setPhoneDialogOpen(next)
        }}
        initialCreci={profile.creci ?? ''}
        onSubmit={handlePhoneSubmit}
      />
    </Form>
  )
}

function AddressSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
      <Skeleton className="size-4 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  )
}

function AddressSummary({ data }: { data: PostalCodeLookup }) {
  const missingNeighborhood = data.neighborhood === ''
  const meta = [data.neighborhood, `${data.city} — ${data.state}`].filter(Boolean).join(' · ')
  return (
    <div className="bg-muted/40 flex items-start gap-3 rounded-md border p-3">
      <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="text-sm leading-tight">
        {data.street && <p className="font-medium">{data.street}</p>}
        <p className={data.street ? 'text-muted-foreground mt-0.5' : 'font-medium'}>{meta}</p>
        {missingNeighborhood && (
          <p className="text-destructive mt-1 text-xs">
            Esse CEP não tem bairro cadastrado. Use outro CEP pra continuar.
          </p>
        )}
      </div>
    </div>
  )
}
