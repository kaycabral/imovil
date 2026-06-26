'use client'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, Input, Switch } from '@cbrl/design'
import { type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'

const brlCentsFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl p-0">
      <CardContent className="flex flex-col gap-4 p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Entrada monetária "cents-first": cada dígito digitado conta como centavo,
 * empurrando os anteriores pra casa de maior ordem. Valor persistido em centavos (int).
 */
export function MoneyField<T extends FieldValues>({
  form,
  name,
  label,
}: {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const cents = typeof field.value === 'number' ? field.value : 0
        const display = cents > 0 ? brlCentsFormatter.format(cents / 100) : ''
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="0,00"
                  className="pl-9"
                  value={display}
                  onKeyDown={(e) => {
                    const allowed = [
                      'Backspace',
                      'Delete',
                      'Tab',
                      'Enter',
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                      'Home',
                      'End',
                    ]
                    if (allowed.includes(e.key)) return
                    if (
                      (e.ctrlKey || e.metaKey) &&
                      ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
                    )
                      return
                    if (!/^\d$/.test(e.key)) e.preventDefault()
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    field.onChange(digits === '' ? 0 : Number(digits))
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <span
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm"
              >
                R$
              </span>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function NumberField<T extends FieldValues>({
  form,
  name,
  label,
  optional,
}: {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  optional?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {optional && <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              value={typeof field.value === 'number' ? field.value : ''}
              onChange={(e) => {
                const raw = e.target.value
                field.onChange(raw === '' ? undefined : Number(raw))
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SwitchField<T extends FieldValues>({
  form,
  name,
  label,
}: {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <FormLabel className="m-0">{label}</FormLabel>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
