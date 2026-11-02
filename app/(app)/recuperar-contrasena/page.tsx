import type { Metadata } from 'next'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | Sportiva',
  description: 'Solicitá un link para restablecer la contraseña de tu cuenta de Sportiva.',
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>
}) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email : ''

  return (
    <AuthPageShell
      title="Recuperar contraseña"
      description="Ingresá tu email y te enviaremos un link para restablecerla."
    >
      <ForgotPasswordForm defaultEmail={email} />
    </AuthPageShell>
  )
}
