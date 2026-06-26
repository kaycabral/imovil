export function Header({ children }: { children: React.ReactNode }) {
  return (
    <header className="border-border/60 bg-background border-b">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
        {children}
      </div>
    </header>
  )
}
