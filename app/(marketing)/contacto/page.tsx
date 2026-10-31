import type { Metadata } from 'next'
import Image from 'next/image'
import { ContactForm, PageShell } from '@/components/marketing/SiteChrome'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Solicitá una demo y descubrí cómo Sportiva puede ordenar la operación de tu club.',
}

export default function ContactoPage() {
  return (
    <PageShell>
      <div className="relative min-h-screen overflow-hidden">
        {/* Fondo con imagen del estadio */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/contact-stadium.jpg"
            alt="Estadio Sportiva"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10100f]/80 via-[#10100f]/55 to-[#10100f]/90" />
        </div>

        {/* Contenedor unificado: Título y Formulario comparten el mismo margen izquierdo y ancho máximo */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-12">
          <div className="mb-8 text-left">
            <span className="route-eyebrow inline-flex mb-4">
              <i />Hablemos de tu club
            </span>
            <h1 className="font-barlow text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-none">
              LA PRÓXIMA JUGADA<br />
              <em className="text-transparent not-italic" style={{ WebkitTextStroke: '1px rgba(238,229,216,.75)' }}>
                EMPIEZA ACÁ.
              </em>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
              Contanos cómo trabajan hoy. Te mostramos cómo Sportiva puede ordenar la operación y devolverle tiempo a tu equipo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <span className="text-xs font-bold text-[#d36f45]">01</span>
                <p className="mt-1 text-base font-bold text-white">Demo personalizada</p>
                <p className="mt-1 text-sm text-zinc-400">Recorré las funciones que tu club necesita.</p>
              </div>
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <span className="text-xs font-bold text-[#d36f45]">02</span>
                <p className="mt-1 text-base font-bold text-white">Implementación acompañada</p>
                <p className="mt-1 text-sm text-zinc-400">No vas a estar solo en el cambio.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta del formulario con la misma alineación */}
          <div className="rounded-3xl border border-white/15 bg-[#191918]/90 backdrop-blur-xl p-8 sm:p-12 shadow-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d36f45]">Solicitar demo</span>
            <h2 className="font-barlow text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-2 mb-8">
              ORDENEMOS EL JUEGO.
            </h2>
            <ContactForm />
          </div>
        </div>

        {/* Mapa en la parte inferior, a mayor ancho (max-w-5xl) y altura adecuada */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-24 pt-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#d36f45]">Ubicación</span>
              <h3 className="text-xl font-bold text-white mt-1">UTN Haedo — Espacio de desarrollo y vinculación</h3>
            </div>
            <span className="text-sm text-zinc-400">Haedo, Buenos Aires, Argentina</span>
          </div>
          <div className="w-full h-80 md:h-[400px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.238944510065!2d-58.59174092350708!3d-34.64795236317765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc7b6cc92e591%3A0x6b772cba8bc4d1e2!2sUniversidad%20Tecnol%C3%B3gica%20Nacional%20%7C%20Facultad%20Regional%20Haedo!5e0!3m2!1ses!2sar!4v1730140000000!5m2!1ses!2sar"
              width="100%"
              height="100%"
              title="Ubicación Sportiva - UTN Haedo"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
