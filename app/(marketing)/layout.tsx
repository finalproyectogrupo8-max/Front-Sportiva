import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'

import './marketing.css'

// Root layout de la landing pública (/, /funciones, /quienes-somos, /contacto).
// Tiene su propio CSS (marketing.css), con todo scopeado bajo html.marketing.
// Pasar de acá al sistema interno (app/(app)) hace una recarga completa, así que
// los estilos de la landing no llegan al panel.

const inter = { variable: '' };
const barlow = { variable: '' };

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

export default function MarketingRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`marketing ${inter.variable} ${barlow.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
