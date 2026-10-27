'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ClubData } from '@/lib/data'
import { normalizeTenant, type Tenant } from '@/lib/tenants'

export type ApiTenant = {
  slug: string
  name: string
}

type ClubContextValue = {
  tenant: Tenant
  data: ClubData
  update: <K extends keyof ClubData>(key: K, fn: (prev: ClubData[K]) => ClubData[K]) => void
  playerName: (id: string) => string
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({
  tenant: rawTenant,
  initialData,
  children,
}: {
  tenant: ApiTenant | Tenant
  initialData: ClubData
  children: React.ReactNode
}) {
  const tenant = useMemo(() => normalizeTenant(rawTenant), [rawTenant])
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', tenant.color)
    root.style.setProperty('--ring', tenant.color)
    return () => {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
    }
  }, [tenant.color])

  const update = useCallback<ClubContextValue['update']>((key, fn) => {
    setData((prev) => ({ ...prev, [key]: fn(prev[key]) }))
  }, [])

  const value = useMemo<ClubContextValue>(() => {
    const byId = new Map(data.players.map((p) => [p.id, p]))
    return {
      tenant,
      data,
      update,
      playerName: (id) => {
        const p = byId.get(id)
        return p ? `${p.nombre} ${p.apellido}` : 'Sin asignar'
      },
    }
  }, [tenant, data, update])

  return (
    <ClubContext.Provider value={value}>
      <div style={{ '--primary': tenant.color, '--ring': tenant.color } as React.CSSProperties} className="contents">
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
