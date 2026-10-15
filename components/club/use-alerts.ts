'use client'

import { useMemo } from 'react'
import { useClub } from './club-provider'

export type Alert = { id: string; title: string; detail: string; href: string; tone: 'bad' | 'warn' }

export function useAlerts(): Alert[] {
  const { tenant, data } = useClub()
  return useMemo(() => {
    const base = `/c/${tenant.slug}`
    const out: Alert[] = []
    data.courts.forEach((c) =>
      c.elementos
        .filter((e) => e.estado === 'fuera')
        .forEach((e) =>
          out.push({
            id: `court-${e.id}`,
            title: `${e.nombre} fuera de servicio`,
            detail: c.nombre,
            href: `${base}/canchas`,
            tone: 'bad',
          }),
        ),
    )
    data.materials
      .filter((m) => m.stock < m.minimo)
      .forEach((m) =>
        out.push({
          id: `mat-${m.id}`,
          title: `Stock bajo: ${m.nombre}`,
          detail: `${m.stock} de ${m.minimo} mínimos`,
          href: `${base}/materiales`,
          tone: m.stock < m.minimo / 2 ? 'bad' : 'warn',
        }),
      )
    data.players
      .filter((p) => p.pase === 'En trámite')
      .forEach((p) =>
        out.push({
          id: `pase-${p.id}`,
          title: `Pase en trámite`,
          detail: `${p.nombre} ${p.apellido} · ${p.deporte} ${p.categoria}`,
          href: `${base}/jugadores?id=${p.id}`,
          tone: 'warn',
        }),
      )
    return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'bad' ? -1 : 1))
  }, [tenant.slug, data])
}
