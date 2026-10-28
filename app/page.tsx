import { hasSession } from '@/lib/session'
import { HomeHeader } from '@/components/home/home-header'
import { HeroSection } from '@/components/home/hero-section'
import { FeatureCarousel } from '@/components/home/feature-carousel'
import { FeaturesGrid } from '@/components/home/features-grid'
import { AboutSection } from '@/components/home/about-section'
import { ContactSection } from '@/components/home/contact-section'
import { HomeFooter } from '@/components/home/home-footer'

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

export default async function HomePage() {
  const sessionActive = await hasSession()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* 1. Header fijo con navegación */}
      <HomeHeader hasSession={sessionActive} />

      <main className="flex-1">
        {/* 2. Hero con título fuerte, bajada, CTAs e imagen de fondo */}
        <HeroSection hasSession={sessionActive} />

        {/* 3. Carrusel interactivo y accesible */}
        <FeatureCarousel />

        {/* 4. Funciones con grilla de tarjetas y estados de sesión */}
        <FeaturesGrid hasSession={sessionActive} />

        {/* 5. Quiénes somos con texto sobrio en español rioplatense */}
        <AboutSection />

        {/* 6. Contacto con formulario conectado a tickets */}
        <ContactSection />
      </main>

      {/* 7. Llamada a la acción final y footer */}
      <HomeFooter hasSession={sessionActive} />
    </div>
  )
}
