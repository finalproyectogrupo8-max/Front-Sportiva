import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
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
  const email = typeof params.email === 'string' ? params.email.trim() : ''

  return (
    <AuthPageShell
      title={token && email ? 'Aceptá tu invitación' : 'Link inválido'}
      description={
        token && email
          ? 'Creá una contraseña para ingresar a Sportiva.'
          : 'El enlace no tiene los datos necesarios para aceptar la invitación.'
      }
    >
      {token && email ? (
        <AcceptInviteForm email={email} token={token} />
      ) : (
        <div className="flex flex-col gap-5">
          <p role="alert" aria-live="assertive" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
            {INVALID_INVITE_MESSAGE}
          </p>
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C8643C] focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      )}
    </AuthPageShell>
  )
}
