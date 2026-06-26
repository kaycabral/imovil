export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
      )}
    </div>
  )
}
