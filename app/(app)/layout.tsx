import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Manrope } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// Root layout del sistema interno (login, panel admin, selector y módulos del club).
// Usa el tema shadcn de globals.css. La landing tiene su propio root layout en app/(marketing),
// así que su CSS nunca se carga acá.

// Fuentes de la marca (las que define la landing): Manrope para el texto y Barlow Condensed para títulos.
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: 'Sportiva — Gestión operativa para clubes',
  description:
    'Sportiva digitaliza la operación de tu club: indumentaria, materiales, partidos, jugadores, profes y canchas en un solo lugar.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f0e9' },
    { media: '(prefers-color-scheme: dark)', color: '#10100f' },
  ],
}

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: next-themes agrega la clase del tema antes de hidratar.
    <html lang="es" className={`${manrope.variable} ${barlow.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'var(--font-manrope), system-ui, sans-serif' } }} />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
