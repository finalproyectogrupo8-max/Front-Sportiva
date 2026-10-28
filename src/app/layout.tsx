import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Sportiva | Gestión operativa para clubes',
    template: '%s | Sportiva',
  },
  description:
    'Partidos, jugadores, fichas médicas, profes, utilería e instalaciones en un solo tablero.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}