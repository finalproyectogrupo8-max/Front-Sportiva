import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión | Sportiva',
  description: 'Accedé al panel operativo de tu club en Sportiva.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

