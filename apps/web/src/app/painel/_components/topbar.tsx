import { AppMenu } from '@/components/app-menu'
import { BrandLink } from '@/components/brand-link'
import { Header } from '@/components/header'

export function Topbar() {
  return (
    <Header>
      <BrandLink className="text-base font-bold tracking-tight md:text-lg">
        Tekoa
        <span className="text-muted-foreground ml-1.5 text-xs font-medium">/ painel</span>
      </BrandLink>
      <AppMenu />
    </Header>
  )
}
