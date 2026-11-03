'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleAlert, Loader2 } from 'lucide-react'
import { login, type LoginState } from '@/lib/auth'

// El login va por Server Action (lib/auth.ts → POST /api/auth/login desde el servidor).
// El navegador nunca habla con la API ni ve el token: queda en cookies httpOnly (ADR-0001).

const inputClass =
  'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand aria-invalid:border-red-500/60'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400 animate-in fade-in duration-200"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span className="leading-snug">{state.error}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          Email
        </label>
        {/* El key vuelve a montar el campo con el email del intento anterior. */}
        <input
          key={state.email ?? ''}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email ?? ''}
          placeholder="ejemplo@club.com"
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-sm text-red-400">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-sm text-red-400">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div className="-mt-3 flex justify-end">
        <Link
          href="/recuperar-contrasena"
          className="text-sm font-semibold text-brand transition hover:brightness-110 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C8643C] px-4 text-sm font-semibold text-white shadow-lg shadow-[#C8643C]/20 transition hover:bg-[#d97349] focus:outline-none focus:ring-2 focus:ring-[#C8643C] focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Iniciando sesión…</span>
          </>
        ) : (
          <>
            <span>Ingresar al club</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      {/* Sin registro público: las cuentas las crea el admin o llegan por invitación (TIZ-9). */}
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-zinc-400">¿No tenés acceso? Pedíselo al administrador de tu club.</p>
        <p className="text-sm text-zinc-400">
          ¿Tu club todavía no usa Sportiva?{' '}
          <Link
            href="/contacto"
            className="font-semibold text-[#C8643C] transition hover:text-[#d97349] hover:underline"
          >
            Solicitá una demo
          </Link>
        </p>
        <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">
          ← Volver al inicio
        </Link>
      </div>
    </form>
  )
}
