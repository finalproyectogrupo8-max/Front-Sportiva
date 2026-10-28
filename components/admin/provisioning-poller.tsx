'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTenantStatusesAction } from '@/app/admin/clubes/actions'

const POLL_INTERVAL_MS = 2500

/**
 * Mientras haya clubes en `provisioning`, consulta su estado cada 2,5 s y refresca la página
 * cuando alguno cambia (a `active` o `failed`). No renderiza nada.
 */
export function ProvisioningPoller({ tenantIds }: { tenantIds: number[] }) {
  const router = useRouter()
  const key = tenantIds.join(',')

  useEffect(() => {
    if (!key) return

    const ids = key.split(',').map(Number)
    let cancelled = false

    const interval = setInterval(async () => {
      const statuses = await getTenantStatusesAction(ids)
      if (cancelled) return
      const changed = ids.some((id) => statuses[id] && statuses[id] !== 'provisioning')
      if (changed) router.refresh()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [key, router])

  return null
}
