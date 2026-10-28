import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

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
  openGraph: {
    title: 'Sportiva — Gestión operativa para clubes',
    description:
      'Plataforma integral de gestión operativa deportiva para clubes, ligas y federaciones.',
    siteName: 'Sportiva',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f6f9',
}

export default function RootLayout({
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
