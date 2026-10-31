import { cn } from '@/lib/utils'

const ENV_LABEL: Record<string, string> = { development: 'Desarrollo', preview: 'Prueba' }

/** Pie del sistema: versión, commit y fecha de compilación. */
export function AppFooter({ className }: { className?: string }) {
  const version = process.env.APP_VERSION
  const commit = process.env.APP_COMMIT
  const builtAt = process.env.APP_BUILT_AT
  const env = ENV_LABEL[process.env.APP_ENV ?? '']
  const built = builtAt
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(builtAt))
    : null

  return (
    <footer className={cn('border-t px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-10', className)}>
      <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground/80">Sportiva {version && `v${version}`}</span>
          {commit && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                build <code className="font-mono">{commit}</code>
              </span>
            </>
          )}
          {built && (
            <>
              <span aria-hidden="true">·</span>
              <span>Actualizado el {built}</span>
            </>
          )}
          {env && <span className="rounded bg-warning/20 px-1.5 py-0.5 font-medium text-foreground">{env}</span>}
        </p>
        <p>{builtAt && `© ${builtAt.slice(0, 4)} `}Sportiva · Gestión operativa para clubes</p>
      </div>
    </footer>
  )
}
