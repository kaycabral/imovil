'use client'

import { formatPhoneBR } from '@/lib/phone'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@cbrl/design'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function BrokerContactDialog({
  open,
  onOpenChange,
  initialCreci,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  initialCreci: string
  onSubmit: (phone: string, creci: string) => Promise<void>
}) {
  const [phoneValue, setPhoneValue] = useState('')
  const [creciValue, setCreciValue] = useState(initialCreci)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPhoneValue('')
      setCreciValue(initialCreci)
      setError(null)
    }
  }, [open, initialCreci])

  async function handleConfirm() {
    const digits = phoneValue.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Informe um celular válido com DDD.')
      return
    }
    const creci = creciValue.trim()
    if (creci.length === 0) {
      setError('Informe seu CRECI.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit(phoneValue.trim(), creci)
    } catch (err) {
      console.error(err)
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quase lá — precisamos do seu contato</DialogTitle>
          <DialogDescription>
            Esse é o número que os clientes interessados vão usar pra falar com você pelo WhatsApp.
            Pedimos uma vez só — nos próximos imóveis, já fica salvo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="broker-phone">Celular</Label>
            <Input
              id="broker-phone"
              inputMode="tel"
              placeholder="(92) 99000-0000"
              value={phoneValue}
              onChange={(e) => setPhoneValue(formatPhoneBR(e.target.value))}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="broker-creci">CRECI</Label>
            <Input
              id="broker-creci"
              placeholder="CRECI-AM 0000-F"
              value={creciValue}
              onChange={(e) => setCreciValue(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Salvar e publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
