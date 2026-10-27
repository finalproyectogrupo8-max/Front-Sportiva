'use client'

import { useActionState } from 'react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { selectTenant, type SelectTenantState } from '@/lib/auth'
import type { Schemas } from '@/lib/api/client'

type TenantSummary = Schemas['TenantSummaryResource']

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'CL'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function ClubSelector({
  tenants,
  initialError,
}: {
  tenants: TenantSummary[]
  initialError?: string
}) {
  const [state, formAction, pending] = useActionState<SelectTenantState, FormData>(
    selectTenant,
    initialError ? { error: initialError } : {},
  )

  return (
    <div className="flex flex-col gap-6">
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tenants.map((t, i) => (
          <li key={t.slug} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
            <form action={formAction} className="h-full">
              <input type="hidden" name="slug" value={t.slug} />
              <button
                type="submit"
                disabled={pending}
                className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted font-display text-base font-bold text-muted-foreground uppercase">
                    {getInitials(t.name)}
                  </div>
                  {pending ? (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ArrowUpRight
                      className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-bold uppercase leading-tight text-foreground">
                    {t.name}
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    {t.slug}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                  <span>Espacio operativo</span>
                  <span className="font-medium text-foreground group-hover:underline">Entrar →</span>
                </div>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}

