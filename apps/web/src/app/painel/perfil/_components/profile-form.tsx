'use client'

import { getClientAuth, getClientDb } from '@/lib/firebase/client'
import { initials } from '@/lib/initials'
import { formatPhoneBR } from '@/lib/phone'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from '@cbrl/design'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export type ProfileFormValues = { phone: string; creci: string }

export function ProfileForm({
  uid,
  displayName,
  email,
  avatarUrl,
  initialValues,
}: {
  uid: string
  displayName: string | null
  email: string | null
  avatarUrl: string | null
  initialValues: ProfileFormValues
}) {
  const [phone, setPhone] = useState(initialValues.phone)
  const [creci, setCreci] = useState(initialValues.creci)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Informe um celular válido com DDD.')
      return
    }
    const creciTrimmed = creci.trim()
    if (creciTrimmed.length === 0) {
      setError('Informe seu CRECI.')
      return
    }

    const user = getClientAuth().currentUser
    if (!user || user.uid !== uid) {
      setError('Sessão expirada — entre novamente.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await setDoc(
        doc(getClientDb(), 'users', uid),
        { phone: phone.trim(), creci: creciTrimmed, updatedAt: serverTimestamp() },
        { merge: true },
      )
      toast.success('Perfil atualizado.')
    } catch (err) {
      console.error(err)
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl p-0">
        <CardContent className="flex items-center gap-4 p-5 md:p-6">
          <Avatar className="size-14">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? ''} />}
            <AvatarFallback>{initials(displayName, email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{displayName ?? 'Sem nome'}</p>
            {email && <p className="text-muted-foreground truncate text-sm">{email}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl p-0">
        <CardContent className="flex flex-col gap-4 p-5 md:p-6">
          <h2 className="text-base font-semibold tracking-tight">Contato para anúncios</h2>
          <p className="text-muted-foreground text-sm">
            Esse é o telefone que os clientes interessados usam pra falar com você pelo WhatsApp,
            junto com o CRECI que aparece no anúncio.
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-phone">Celular</Label>
            <Input
              id="profile-phone"
              inputMode="tel"
              placeholder="(92) 99000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-creci">CRECI</Label>
            <Input
              id="profile-creci"
              placeholder="CRECI-AM 0000-F"
              value={creci}
              onChange={(e) => setCreci(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
