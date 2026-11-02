'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleAlert, Loader2 } from 'lucide-react'
import { resetPassword, type ResetPasswordState } from '@/lib/auth'

const inputClass =
  'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand aria-invalid:border-red-500/60'

function recoveryHref(email: string) {
  return email ? `/recuperar-contrasena?email=${encodeURIComponent(email)}` : '/recuperar-contrasena'
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, {})
  const [confirmationError, setConfirmationError] = useState<string>()
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<HTMLInputElement>(null)
  const invalidLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (state.fieldErrors?.password) {
      passwordRef.current?.focus()
    } else if (state.fieldErrors?.confirmation) {
      confirmationRef.current?.focus()
    }
    if (state.invalidLink) invalidLinkRef.current?.focus()
  }, [state.fieldErrors, state.invalidLink])

  function validateConfirmation(event: FormEvent<HTMLFormElement>) {
    setConfirmationError(undefined)
    if (passwordRef.current?.value !== confirmationRef.current?.value) {
      event.preventDefault()
      setConfirmationError('Las contraseñas no coinciden.')
      confirmationRef.current?.focus()
    }
  }

  if (state.invalidLink) {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
          El link venció o ya no es válido.
        </p>
        <Link
          ref={invalidLinkRef}
          href={recoveryHref(email)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-ink transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Pedir un link nuevo
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <form action={action} onSubmit={validateConfirmation} className="flex flex-col gap-5">
      <input type="hidden" name="email" value={email} autoComplete="email" />
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span className="leading-snug">{state.error}</span>
        </div>
      )}

      <p className="text-sm leading-relaxed text-zinc-400">
        Elegí una contraseña que cumpla con los requisitos de seguridad. Si no cumple, te indicaremos qué cambiar.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Nueva contraseña
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.password && (
          <p id="password-error" role="alert" className="text-sm text-red-400">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password_confirmation" className="text-sm font-medium text-zinc-300">
          Confirmá la nueva contraseña
        </label>
        <input
          ref={confirmationRef}
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state.fieldErrors?.confirmation || confirmationError ? true : undefined}
          aria-describedby={
            state.fieldErrors?.confirmation || confirmationError ? 'confirmation-error' : undefined
          }
          className={inputClass}
        />
        {(state.fieldErrors?.confirmation || confirmationError) && (
          <p id="confirmation-error" role="alert" className="text-sm text-red-400">
            {confirmationError ?? state.fieldErrors?.confirmation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-ink shadow-lg shadow-brand/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Restableciendo…</span>
          </>
        ) : (
          <>
            <span>Restablecer contraseña</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <Link
        href={recoveryHref(email)}
        className="text-center text-sm text-zinc-400 transition hover:text-white"
      >
        Pedir un link nuevo
      </Link>
    </form>
  )
}
