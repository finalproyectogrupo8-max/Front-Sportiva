'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getTenantStatusesAction } from '@/app/admin/clubes/actions'

// Sigue los clubes recién creados mientras su base se aprovisiona en segundo plano, en cualquier
// pantalla del admin, y avisa con un toast cuando quedan activos (o si fallan).
// Se guardan en sessionStorage para no perderlos si se recarga la página.

type Watched = { id: number; name: string }

const STORAGE_KEY = 'sportiva:provisioning'
const POLL_INTERVAL_MS = 2500

const WatcherContext = createContext<(club: Watched) => void>(() => {})

/** Para avisar al vigilante que empiece a seguir un club recién creado. */
export function useWatchProvisioning() {
  return useContext(WatcherContext)
}

function readStored(): Watched[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Watched[]) : []
  } catch {
    return []
  }
}

function store(clubs: Watched[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
  } catch {
    // Sin sessionStorage (modo privado, etc.): se sigue igual mientras la página esté abierta.
  }
}

export function ProvisioningWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Arranca vacío para que el render del servidor y el del navegador coincidan; lo guardado se lee al montar.
  const [watched, setWatched] = useState<Watched[]>([])

  useEffect(() => {
    const stored = readStored()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con sessionStorage al montar
    if (stored.length > 0) setWatched(stored)
  }, [])

  const update = useCallback((next: (prev: Watched[]) => Watched[]) => {
    setWatched((prev) => {
      const value = next(prev)
      store(value)
      return value
    })
  }, [])

  const watch = useCallback(
    (club: Watched) => update((prev) => (prev.some((c) => c.id === club.id) ? prev : [...prev, club])),
    [update],
  )

  const key = watched.map((club) => club.id).join(',')

  useEffect(() => {
    if (!key) return
    let cancelled = false

    const interval = setInterval(async () => {
      const ids = key.split(',').map(Number)
      const statuses = await getTenantStatusesAction(ids)
      if (cancelled) return

      const finished = watched.filter((club) => statuses[club.id] && statuses[club.id] !== 'provisioning')
      if (finished.length === 0) return

      for (const club of finished) {
        if (statuses[club.id] === 'active') {
          toast.success(`La base de datos de ${club.name} está lista.`, {
            description: 'El club ya está activo y sus miembros pueden entrar.',
            action: { label: 'Ver club', onClick: () => router.push(`/admin/clubes/${club.id}`) },
          })
        } else if (statuses[club.id] === 'failed') {
          toast.error(`No se pudo crear la base de datos de ${club.name}.`, {
            description: 'Podés reintentarlo desde el listado de clubes.',
            action: { label: 'Ir a Clubes', onClick: () => router.push('/admin/clubes') },
          })
        }
      }

      const done = new Set(finished.map((club) => club.id))
      update((prev) => prev.filter((club) => !done.has(club.id)))
      router.refresh()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [key, watched, router, update])

  return <WatcherContext.Provider value={watch}>{children}</WatcherContext.Provider>
}
