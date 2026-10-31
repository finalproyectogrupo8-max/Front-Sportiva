'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ClubData } from '@/lib/data'
import { getModule, visibleModules, type ModuleDef } from '@/lib/modules'
import { normalizeTenant, type ApiTenant, type Tenant } from '@/lib/tenants'

type ClubContextValue = {
  tenant: Tenant
  data: ClubData
  update: <K extends keyof ClubData>(key: K, fn: (prev: ClubData[K]) => ClubData[K]) => void
  playerName: (id: string) => string
  /** Si el usuario tiene el permiso (`<recurso>.<acción>`) en este club. Es solo UX: la API valida igual. */
  can: (permission: string) => boolean
  /** Alcance del permiso: `all` (todo el club), `own` (sus categorías) o null si no lo tiene. */
  scopeOf: (permission: string) => 'all' | 'own' | null
  /** Módulos que el usuario puede ver, en el orden del menú. */
  modules: ModuleDef[]
  /** Si el usuario ve el módulo. */
  canSee: (moduleId: string) => boolean
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({
  tenant: rawTenant,
  initialData,
  permissions,
  permissionScopes,
  children,
}: {
  tenant: ApiTenant | Tenant
  initialData: ClubData
  /** Permisos del usuario en el club, de `GET /api/me`. */
  permissions: string[]
  permissionScopes?: Record<string, string>
  children: React.ReactNode
}) {
  const tenant = useMemo(() => normalizeTenant(rawTenant), [rawTenant])
  const [data, setData] = useState(initialData)

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

  const update = useCallback<ClubContextValue['update']>((key, fn) => {
    setData((prev) => ({ ...prev, [key]: fn(prev[key]) }))
  }, [])

  const access = useMemo(() => {
    const granted = new Set(permissions)
    const modules = visibleModules(permissions)
    const visible = new Set<string>(modules.map((m) => m.id))
    return {
      can: (permission: string) => granted.has(permission),
      scopeOf: (permission: string) =>
        granted.has(permission) ? (permissionScopes?.[permission] === 'own' ? 'own' : 'all') : null,
      modules,
      canSee: (moduleId: string) => !!getModule(moduleId) && visible.has(moduleId),
    } satisfies Pick<ClubContextValue, 'can' | 'scopeOf' | 'modules' | 'canSee'>
  }, [permissions, permissionScopes])

  const value = useMemo<ClubContextValue>(() => {
    const byId = new Map(data.players.map((p) => [p.id, p]))
    return {
      ...access,
      tenant,
      data,
      update,
      playerName: (id) => {
        const p = byId.get(id)
        return p ? `${p.nombre} ${p.apellido}` : 'Sin asignar'
      },
    }
  }, [access, tenant, data, update])

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
