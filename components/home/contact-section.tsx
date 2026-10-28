import { ContactForm } from '@/components/contact/contact-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MessageSquare } from 'lucide-react'

export function ContactSection() {
  return (
    <section id="contacto" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
        {/* Columna informativa */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">
            Contacto directo
          </span>
          <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl leading-tight">
            ¿Querés sumar tu club a Sportiva?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Escribinos para conocer más sobre la plataforma, consultar por la adopción de Sportiva en tu institución o coordinar una demostración operativa.
          </p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <MessageSquare className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Soporte y atención
                </span>
                <span className="text-xs text-muted-foreground">
                  Atención personalizada para dirigentes y coordinadores.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border/40">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Mail className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Respuesta ágil
                </span>
                <span className="text-xs text-muted-foreground">
                  Recibimos tu ticket y nos comunicamos por email.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna con formulario */}
        <div className="lg:col-span-7">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="gap-1.5 p-6 sm:p-8">
              <CardTitle className="font-display text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
                Envianos tu mensaje
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                Completá los campos y te responderemos a la brevedad. Si pertenecés a un club, indicalo para orientar mejor nuestra respuesta.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
