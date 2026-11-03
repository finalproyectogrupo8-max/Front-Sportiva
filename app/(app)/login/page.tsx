import { redirect } from 'next/navigation'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { LoginForm } from '@/components/auth/login-form'
import { landingPath } from '@/lib/session'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string | string[]; invitacion?: string | string[] }>
}) {
  const params = await searchParams
  const passwordUpdated = params.aviso === 'contrasena-actualizada'
  const invitationAccepted = params.invitacion === 'aceptada'
  const destination = await landingPath()
  if (destination && !passwordUpdated && !invitationAccepted) redirect(destination)

  return (
    <AuthPageShell title="Iniciar sesión" description="Accedé al panel de tu club con tu correo electrónico y contraseña.">
      {passwordUpdated && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300"
        >
          Contraseña actualizada. Ya podés iniciar sesión con tu nueva contraseña.
        </p>
      )}
      {invitationAccepted && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300"
        >
          Listo, ya podés ingresar.
        </p>
      )}
      <LoginForm />
    </AuthPageShell>
  )
}
