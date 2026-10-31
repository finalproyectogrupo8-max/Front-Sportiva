import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Manrope } from 'next/font/google'
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
  colorScheme: 'light',
  themeColor: '#f5f0e9',
}

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${barlow.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'var(--font-manrope), system-ui, sans-serif' } }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
