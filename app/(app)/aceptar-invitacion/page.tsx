import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

export const metadata: Metadata = {
  title: 'Aceptar invitación | Sportiva',
  description: 'Elegí una contraseña para ingresar a Sportiva.',
  referrer: 'no-referrer',
}

const INVALID_INVITE_MESSAGE =
  'El enlace venció o no es válido. Pedile a quien te invitó que te reenvíe la invitación.'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; email?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''
  const email = typeof params.email === 'string' ? params.email : ''

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <section className="flex w-full max-w-md flex-col gap-8">
        <Link href="/" aria-label="Sportiva, ir al inicio" className="w-fit">
          <Logo light />
        </Link>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Aceptá tu invitación</h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Creá una contraseña para ingresar a Sportiva.
          </p>
        </div>
        {token && email ? (
          <AcceptInviteForm email={email} token={token} />
        ) : (
          <div className="flex flex-col gap-4">
            <p role="alert" aria-live="assertive" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
              {INVALID_INVITE_MESSAGE}
            </p>
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
