import 'server-only'

import type { ApiResult } from '@/lib/api/client'

// Ayudas para las exportaciones (FRO-29): traer todas las páginas de un listado de la API.

type Page<T> = { data: T[]; meta?: { last_page?: number } }

export async function allPages<T>(fetchPage: (page: number) => Promise<ApiResult<Page<T>>>, max = 20): Promise<T[] | null> {
  const items: T[] = []
  for (let page = 1; page <= max; page++) {
    const result = await fetchPage(page)
    if (!result.ok) return page === 1 ? null : items
    items.push(...result.data.data)
    if (!result.data.meta?.last_page || page >= result.data.meta.last_page) break
  }
  return items
}

export const fmtDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '')
