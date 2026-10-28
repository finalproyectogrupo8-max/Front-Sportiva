import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactForm } from '@/components/contact/contact-form'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Contacto | Sportiva',
  description: 'Comunicate con el equipo de Sportiva. Envianos tu consulta o solicitud de soporte.',
}

export default function ContactoPage() {
  return (
    <main className="min-h-dvh bg-muted/30">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Logo />
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-xs text-muted-foreground hover:text-foreground',
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-16 pt-4 sm:px-6">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="gap-2 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Contacto y Soporte
            </span>
            <CardTitle className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Hablemos de tu club
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              Completá el formulario con tus datos y tu consulta. Si formás parte de un club, podés indicarlo para agilizar la respuesta.
            </CardDescription>
          </CardHeader>
          <CardContent className="sm:p-8 sm:pt-0">
            <ContactForm />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

