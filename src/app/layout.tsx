import { AutoSignIn } from '@/components/auto-sign-in'
import { WebAnalytics } from '@/components/web-analytics'
import { ThemeProvider, Toaster } from '@cbrl/design'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Imovil — alugue seu próximo lugar',
  description:
    'Aluguel de imóveis com tudo o que importa no topo: preço total, bairro, distância e pet.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <AutoSignIn />
          <Toaster />
        </ThemeProvider>
        {/* Only production deployments on Vercel serve the analytics endpoint. */}
        {process.env.VERCEL_ENV === 'production' ? <WebAnalytics /> : null}
      </body>
    </html>
  )
}
