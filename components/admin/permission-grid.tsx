'use client'

import type { PermissionModule } from '@/lib/api/admin'
import { cn } from '@/lib/utils'

/** Permisos elegidos: nombre → alcance (`all` todo el club, `own` sus categorías). */
export type PermissionSelection = Record<string, 'all' | 'own'>

/**
 * Grilla de checks módulo × acción para armar un rol (docs/roles-y-permisos.md §5 de la API).
 * En las acciones que lo admiten, un selector elige "Todo el club" o "Sus categorías".
 */
export function PermissionGrid({
  modules,
  value,
  onChange,
  readOnly,
}: {
  modules: PermissionModule[]
  value: PermissionSelection
  onChange?: (next: PermissionSelection) => void
  readOnly?: boolean
}) {
  const set = (name: string, scope: 'all' | 'own' | null) => {
    if (!onChange) return
    const next = { ...value }
    if (scope === null) delete next[name]
    else next[name] = scope
    onChange(next)
  }

  const toggleModule = (module: PermissionModule, checked: boolean) => {
    if (!onChange) return
    const next = { ...value }
    for (const resource of module.resources) {
      for (const action of resource.actions) {
        if (checked) next[action.name] ??= 'all'
        else delete next[action.name]
      }
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {modules.map((module) => {
        const names = module.resources.flatMap((resource) => resource.actions.map((action) => action.name))
        const selected = names.filter((name) => name in value).length
        const all = selected === names.length

        return (
          <section key={module.key} className="rounded-lg border" aria-labelledby={`module-${module.key}`}>
            <header className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
              <h3 id={`module-${module.key}`} className="text-sm font-semibold text-foreground">
                {module.label}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {selected}/{names.length}
                </span>
              </h3>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => toggleModule(module, !all)}
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                >
                  {all ? 'Quitar todo' : 'Marcar todo'}
                </button>
              )}
            </header>

            <div className="flex flex-col divide-y">
              {module.resources.map((resource) => (
                <div key={resource.key} className="flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
                  <span className="w-40 shrink-0 pt-1 text-xs font-medium text-muted-foreground">{resource.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.actions.map((action) => {
                      const scope = value[action.name]
                      const checked = scope !== undefined
                      const id = `perm-${action.name}`

                      return (
                        <span
                          key={action.name}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                            checked ? 'border-primary/40 bg-primary/10 text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            disabled={readOnly}
                            onChange={(event) => set(action.name, event.target.checked ? 'all' : null)}
                            className="size-3.5 accent-primary"
                          />
                          <label htmlFor={id} className={cn(!readOnly && 'cursor-pointer')}>
                            {action.label}
                          </label>
                          {action.scopable && checked && (
                            <select
                              aria-label={`Alcance de ${resource.label}: ${action.label}`}
                              value={scope}
                              disabled={readOnly}
                              onChange={(event) => set(action.name, event.target.value as 'all' | 'own')}
                              className="ml-0.5 rounded border-0 bg-transparent py-0 pr-1 text-[11px] text-primary outline-none disabled:opacity-100"
                            >
                              <option value="all">Todo el club</option>
                              <option value="own">Sus categorías</option>
                            </select>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
