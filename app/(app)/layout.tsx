import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// Root layout del sistema interno (login, registro, panel admin, selector y módulos del club).
// Usa el tema shadcn de globals.css. La landing tiene su propio root layout en app/(marketing),
// así que su CSS nunca se carga acá.

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
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
  themeColor: '#f5f6f9',
}

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${barlow.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'var(--font-inter), system-ui, sans-serif' } }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
