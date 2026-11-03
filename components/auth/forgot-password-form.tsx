'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleAlert, Loader2 } from 'lucide-react'
import { requestPasswordReset, type ForgotPasswordState } from '@/lib/auth'

const inputClass =
  'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand aria-invalid:border-red-500/60'

export function ForgotPasswordForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(requestPasswordReset, {
    email: defaultEmail,
  })
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.fieldErrors?.email) emailRef.current?.focus()
  }, [state.fieldErrors])

  if (state.success) {
    return (
      <div className="flex flex-col gap-5">
        <p
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm leading-relaxed text-emerald-300"
        >
          Si el email está registrado, te mandamos un link para restablecer la contraseña.
        </p>
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-ink transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Volver al inicio de sesión
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
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

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          ref={emailRef}
          key={state.email ?? defaultEmail}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email ?? defaultEmail}
          placeholder="ejemplo@club.com"
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" role="alert" className="text-sm text-red-400">
            {state.fieldErrors.email}
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
            <span>Enviando link…</span>
          </>
        ) : (
          <>
            <span>Enviar link</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <Link href="/login" className="text-center text-sm text-zinc-400 transition hover:text-white">
        Volver al inicio de sesión
      </Link>
    </form>
  )
}
