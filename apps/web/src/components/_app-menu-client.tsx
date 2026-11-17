'use client'

import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { useSignOut } from '@/hooks/use-sign-out'
import { useUser } from '@/hooks/use-user'
import type { Features } from '@/lib/features'
import { initials } from '@/lib/initials'
import { getNavItems, isActive, type NavItem } from '@/lib/painel-nav'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@cbrl/design'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, LogOut, Menu, Moon, Plus, Sun, User } from 'lucide-react'
import type { Route } from 'next'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type PrimaryCta = {
  label: string
  href: Route
  icon?: LucideIcon
}

type Props = {
  features: Features
  primaryCta?: PrimaryCta
}

const DEFAULT_CTA: PrimaryCta = {
  label: 'Publicar imóvel',
  href: '/painel/imoveis/novo',
  icon: Plus,
}

export function AppMenuClient({ features, primaryCta = DEFAULT_CTA }: Props) {
  return (
    <>
      <DesktopCluster features={features} primaryCta={primaryCta} />
      <MobileCluster features={features} primaryCta={primaryCta} />
    </>
  )
}

function DesktopCluster({ features, primaryCta }: { features: Features; primaryCta: PrimaryCta }) {
  const { user } = useUser()
  const navItems = user ? getNavItems(features) : []
  return (
    <div className="hidden items-center gap-2 md:flex">
      {navItems.length > 0 && <DesktopNav navItems={navItems} />}
      <ThemeToggleButton />
      <Button asChild>
        <Link href={primaryCta.href}>{primaryCta.label}</Link>
      </Button>
      <AuthCluster />
    </div>
  )
}

function DesktopNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="mr-2 flex items-center gap-1" aria-label="Painel">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function AuthCluster() {
  const { user, loading } = useUser()
  const { signIn, loading: signingIn } = useGoogleSignIn()
  const signOut = useSignOut()

  if (loading) return null
  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        onClick={() => void signIn()}
        disabled={signingIn}
      >
        {signingIn ? 'Conectando…' : 'Entrar'}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="border-border/60 hover:bg-secondary/60 focus-visible:ring-ring data-[state=open]:bg-secondary group flex cursor-pointer items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 transition-colors outline-none focus-visible:ring-2"
        aria-label="Abrir menu da conta"
      >
        <Avatar className="size-7">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ''} />}
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <ChevronDown className="text-muted-foreground size-3.5 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          {user.name && <span className="text-sm font-medium">{user.name}</span>}
          {user.email && (
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={'/painel/perfil'}>
            <User className="mr-2 size-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="mr-2 size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileCluster({ features, primaryCta }: { features: Features; primaryCta: PrimaryCta }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signIn, loading: signingIn } = useGoogleSignIn()
  const signOut = useSignOut()
  const [open, setOpen] = useState(false)
  const navItems = user ? getNavItems(features) : []
  const CtaIcon = primaryCta.icon

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          className="hover:text-foreground hover:bg-muted rounded-full md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-80 max-w-[85vw] flex-col gap-0 p-0">
        <SheetHeader className="border-border/60 border-b px-5 py-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação e ações da conta.</SheetDescription>
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ''} />}
                <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
                {user.email && (
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium">Menu</p>
          )}
        </SheetHeader>

        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link href={item.href} className={mobileNavLinkClass(active)}>
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </SheetClose>
                </li>
              )
            })}
            {user && (
              <li>
                <SheetClose asChild>
                  <Link
                    href={'/painel/perfil'}
                    className={mobileNavLinkClass(pathname.startsWith('/painel/perfil'))}
                  >
                    <User className="size-4" />
                    Perfil
                  </Link>
                </SheetClose>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-border/60 flex flex-col gap-2 border-t px-5 py-4">
          {user ? (
            <SheetClose asChild>
              <Button asChild className="w-full">
                <Link href={primaryCta.href}>
                  {CtaIcon && <CtaIcon className="size-4" />}
                  {primaryCta.label}
                </Link>
              </Button>
            </SheetClose>
          ) : (
            <Button
              className="w-full rounded-full"
              onClick={() => {
                setOpen(false)
                void signIn()
              }}
              disabled={signingIn}
            >
              {signingIn ? 'Conectando…' : 'Entrar'}
            </Button>
          )}
          <div className="flex items-center justify-between">
            <ThemeToggleButton variant="labelled" />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  void signOut()
                }}
                className="text-muted-foreground hover:text-foreground gap-2 rounded-full"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ThemeToggleButton({ variant = 'icon' }: { variant?: 'icon' | 'labelled' }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Tema claro' : 'Tema escuro'

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="hover:text-foreground hover:bg-muted rounded-full"
      >
        <Icon className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="text-muted-foreground hover:text-foreground -ml-2 gap-2 rounded-full"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  )
}

function mobileNavLinkClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
    active
      ? 'bg-secondary text-foreground font-medium'
      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
  }`
}
