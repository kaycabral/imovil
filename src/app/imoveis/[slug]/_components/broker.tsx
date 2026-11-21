import { Button, Card, CardContent, initials, WhatsappIcon } from '@cbrl/design'
import Image from 'next/image'

type Props = {
  name: string
  role: string
  creci: string
  whatsappUrl: string
  avatar: string | null
}

export function Broker({ name, role, creci, whatsappUrl, avatar }: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="bg-muted text-muted-foreground ring-border/70 relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium ring-1">
            {avatar ? (
              <Image src={avatar} alt={name} fill sizes="56px" className="object-cover" />
            ) : (
              <span>{initials(name, null)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{role}</p>
            <h3 className="truncate text-base font-semibold tracking-tight">{name}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">{creci}</p>
          </div>
        </div>

        <Button asChild className="bg-wa text-wa-foreground hover:bg-wa/90 mt-5 w-full">
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <WhatsappIcon className="size-[18px]" />
            Falar no WhatsApp
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
