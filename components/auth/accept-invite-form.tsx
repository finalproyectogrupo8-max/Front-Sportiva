'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { acceptInviteAction, type AcceptInviteState } from '@/app/(app)/aceptar-invitacion/actions'

const inputClass =
  'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-[#C8643C] focus:outline-none focus:ring-1 focus:ring-[#C8643C] aria-invalid:border-red-500/60'

export function AcceptInviteForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState<AcceptInviteState, FormData>(acceptInviteAction, {})

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="invite-password" className="text-sm font-medium text-zinc-300">
          Elegí una contraseña
        </label>
        <input
          id="invite-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? 'invite-password-error' : 'invite-password-help'}
          className={inputClass}
        />
        {state.fieldErrors?.password ? (
          <p id="invite-password-error" role="alert" aria-live="polite" className="text-sm text-red-400">
            {state.fieldErrors.password}
          </p>
        ) : (
          <p id="invite-password-help" className="text-xs text-zinc-500">
            Usá al menos 8 caracteres.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="invite-password-confirmation" className="text-sm font-medium text-zinc-300">
          Confirmá la contraseña
        </label>
        <input
          id="invite-password-confirmation"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={state.fieldErrors?.password_confirmation ? true : undefined}
          aria-describedby={state.fieldErrors?.password_confirmation ? 'invite-password-confirmation-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.password_confirmation && (
          <p
            id="invite-password-confirmation-error"
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400"
          >
            {state.fieldErrors.password_confirmation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C8643C] px-4 text-sm font-semibold text-white shadow-lg shadow-[#C8643C]/20 transition hover:bg-[#d97349] focus:outline-none focus:ring-2 focus:ring-[#C8643C] focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Guardando...</span>
          </>
        ) : (
          <>
            <span>Crear contraseña</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <Link href="/login" className="text-center text-sm text-zinc-400 hover:text-zinc-200 hover:underline">
        Volver al inicio de sesión
      </Link>
    </form>
  )
}
