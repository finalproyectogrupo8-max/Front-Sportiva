import type { Metadata } from 'next'
import { ContactForm, PageShell } from '@/components/marketing/SiteChrome'

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
          <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mt-8 shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.238944510065!2d-58.59174092350708!3d-34.64795236317765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc7b6cc92e591%3A0x6b772cba8bc4d1e2!2sUniversidad%20Tecnol%C3%B3gica%20Nacional%20%7C%20Facultad%20Regional%20Haedo!5e0!3m2!1ses!2sar!4v1730140000000!5m2!1ses!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
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
