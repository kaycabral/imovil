import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-border/60 mt-12 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 text-xs md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-foreground text-sm font-semibold">Tekoa</p>
        <nav className="flex items-center gap-4">
          <Link href={'/novidades'} className="hover:text-foreground transition-colors">
            Novidades
          </Link>
          <Link href={'/privacidade'} className="hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <Link href={'/termos'} className="hover:text-foreground transition-colors">
            Termos
          </Link>
        </nav>
        <p className="tabular-nums">© {new Date().getFullYear()} · Tekoa</p>
      </div>
    </footer>
  )
}
