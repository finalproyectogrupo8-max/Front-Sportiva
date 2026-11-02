import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Restablecer contraseña | Sportiva',
  description: 'Elegí una nueva contraseña para tu cuenta de Sportiva.',
  referrer: 'no-referrer',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; email?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''
  const email = typeof params.email === 'string' ? params.email.trim() : ''
  const hasValidLink = Boolean(token.trim() && email)

  return (
    <AuthPageShell
      title={hasValidLink ? 'Restablecer contraseña' : 'Link inválido'}
      description={
        hasValidLink
          ? 'Creá una contraseña nueva para volver a ingresar a Sportiva.'
          : 'El link no tiene los datos necesarios para restablecer la contraseña.'
      }
    >
      {hasValidLink ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <div className="flex flex-col gap-5">
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
            Revisá el link o pedí uno nuevo.
          </p>
          <Link
            href={email ? `/recuperar-contrasena?email=${encodeURIComponent(email)}` : '/recuperar-contrasena'}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-ink transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Pedir un link nuevo
          </Link>
        </div>
      )}
    </AuthPageShell>
  )
}
