'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'
import { getModule, visibleModules, type ModuleDef } from '@/lib/modules'
import { tenantFromApi, type ApiTenant, type Tenant } from '@/lib/tenants'

type ClubContextValue = {
  tenant: Tenant
  /** Si el usuario tiene el permiso (`<recurso>.<acción>`) en este club. Es solo UX: la API valida igual. */
  can: (permission: string) => boolean
  /** Alcance del permiso: `all` (todo el club), `sport` (sus deportes), `own` (sus categorías) o null. */
  scopeOf: (permission: string) => 'all' | 'sport' | 'own' | null
  /** Módulos que el usuario puede ver, en el orden del menú. */
  modules: ModuleDef[]
  /** Si el usuario ve el módulo. */
  canSee: (moduleId: string) => boolean
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({
  tenant: rawTenant,
  permissions,
  permissionScopes,
  children,
}: {
  tenant: ApiTenant
  /** Permisos del usuario en el club, de `GET /api/me`. */
  permissions: string[]
  permissionScopes?: Record<string, string>
  children: React.ReactNode
}) {
  const tenant = useMemo(() => tenantFromApi(rawTenant), [rawTenant])

  // El color del club es solo un acento (--club: escudo, chips). La estructura y los botones
  // usan siempre la marca Sportiva. Se pone en <html> para que también lo vean los portales
  // (menús, diálogos), que se montan fuera de este árbol.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--club', tenant.color)
    return () => {
      root.style.removeProperty('--club')
    }
  }, [tenant.color])

  const access = useMemo(() => {
    const granted = new Set(permissions)
    const modules = visibleModules(permissions)
    const visible = new Set<string>(modules.map((m) => m.id))
    return {
      can: (permission: string) => granted.has(permission),
      scopeOf: (permission: string) => {
        if (!granted.has(permission)) return null
        const scope = permissionScopes?.[permission]
        return scope === 'all' || scope === 'sport' || scope === 'own' ? scope : null
      },
      modules,
      canSee: (moduleId: string) => !!getModule(moduleId) && visible.has(moduleId),
    } satisfies Pick<ClubContextValue, 'can' | 'scopeOf' | 'modules' | 'canSee'>
  }, [permissions, permissionScopes])

  const value = useMemo<ClubContextValue>(() => ({ ...access, tenant }), [access, tenant])

  return (
    <ClubContext.Provider value={value}>
      <div style={{ '--club': tenant.color } as React.CSSProperties} className="contents">
        {children}
      </div>
    </ClubContext.Provider>
  )
}

export function useClub() {
  const ctx = useContext(ClubContext)
  if (!ctx) throw new Error('useClub debe usarse dentro de ClubProvider')
  return ctx
}
