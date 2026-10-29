import { hasSession } from '@/lib/session'
import HomePage from '@/components/marketing/HomePage'

export const metadata = {
  title: 'Sportiva — Gestión operativa para clubes deportivos',
  description:
    'Organizá partidos, fichas médicas de jugadores, profes, utilería y canchas en un solo tablero operativo. Cada club con su propio espacio de trabajo.',
  openGraph: {
    title: 'Sportiva — Gestión operativa para clubes deportivos',
    description:
      'Partidos, fichas de jugadores, profesores, utilería y canchas en un solo lugar.',
    siteName: 'Sportiva',
  },
}

export default async function Page() {
  const sessionActive = await hasSession()

  return <HomePage hasSession={sessionActive} />
}
