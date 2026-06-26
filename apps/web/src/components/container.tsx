import { cn } from '@cbrl/design'

type ContainerProps = {
  width?: 'wide' | 'standard'
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav'
  className?: string
  children: React.ReactNode
}

export function Container({
  width = 'standard',
  as: Tag = 'div',
  className,
  children,
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full',
        width === 'wide' ? 'max-w-[1600px]' : 'max-w-[1200px]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
