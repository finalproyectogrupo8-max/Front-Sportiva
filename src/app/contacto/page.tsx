import type { Metadata } from 'next'
import { ContactForm, PageShell } from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Solicitá una demo y descubrí cómo Sportiva puede ordenar la operación de tu club.',
}

export default function ContactoPage() {
  return (
    <PageShell>
      <section className="contact-route">
        <div className="contact-route-copy">
          <span className="route-eyebrow"><i />Hablemos de tu club</span>
          <h1>LA PRÓXIMA JUGADA<br /><em>EMPIEZA ACÁ.</em></h1>
          <p>Contanos cómo trabajan hoy. Te mostramos cómo Sportiva puede ordenar la operación y devolverle tiempo a tu equipo.</p>
          <div className="contact-data">
            <div><span>01</span><p><b>Demo personalizada</b><small>Recorré las funciones que tu club necesita.</small></p></div>
            <div><span>02</span><p><b>Implementación acompañada</b><small>No vas a estar solo en el cambio.</small></p></div>
          </div>
        </div>
        <div className="contact-route-card">
          <span>Solicitar demo</span>
          <h2>ORDENEMOS EL JUEGO.</h2>
          <ContactForm />
        </div>
      </section>
    </PageShell>
  )
}