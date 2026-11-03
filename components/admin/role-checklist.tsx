import type { ClubRole } from '@/lib/api/admin'
import { cn } from '@/lib/utils'

/**
 * Checkboxes `roles` (slugs) para dar acceso a un club. Un usuario puede tener varios roles y sus
 * permisos se suman (docs/roles-y-permisos.md de la API).
 */
export function RoleChecklist({
  roles,
  defaultSelected = [],
  disabled,
  error,
  idPrefix,
}: {
  roles: ClubRole[]
  defaultSelected?: string[]
  disabled?: boolean
  error?: string
  /** Para que los ids de los checkboxes no se repitan si hay varias listas en la página. */
  idPrefix: string
}) {
  const assignableRoles = roles.filter((role) => role.slug !== 'coordinator')
  const hasRetiredCoordinator = defaultSelected.includes('coordinator')

  if (assignableRoles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {roles.length === 0
            ? 'El club todavía no tiene roles. Se crean cuando termina el alta del club.'
            : 'No hay roles disponibles para asignar.'}
        </p>
        {hasRetiredCoordinator && (
          <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
            Esta membresía conserva el rol retirado «coordinator». Revisá y reasigná sus accesos manualmente.
          </p>
        )}
      </div>
    )
  }

  return (
    <fieldset className="flex flex-col gap-1.5" aria-invalid={error ? true : undefined}>
      <legend className="sr-only">Roles</legend>
      <div className={cn('flex flex-col divide-y rounded-lg border', error && 'border-destructive/50')}>
        {assignableRoles.map((role) => {
          const id = `${idPrefix}-role-${role.slug}`
          return (
            <label
              key={role.slug}
              htmlFor={id}
              className="flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                id={id}
                type="checkbox"
                name="roles"
                value={role.slug}
                defaultChecked={defaultSelected.includes(role.slug)}
                disabled={disabled}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {role.name}
                  {!role.is_system && (
                    <span className="rounded bg-primary/10 px-1 py-px text-[10px] font-medium text-primary">
                      Custom
                    </span>
                  )}
                </span>
                {role.description && (
                  <span className="text-xs text-muted-foreground">{role.description}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">Podés elegir más de uno: los permisos se suman.</p>
      {hasRetiredCoordinator && (
        <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          Esta membresía conserva el rol retirado «coordinator». Revisá y reasigná sus accesos manualmente.
        </p>
      )}
      {error && <p role="alert" aria-live="polite" className="text-xs text-destructive">{error}</p>}
    </fieldset>
  )
}
