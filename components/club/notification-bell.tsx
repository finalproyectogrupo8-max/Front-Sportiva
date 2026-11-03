'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { markAllReadAction, markReadAction } from '@/app/(app)/c/[club]/notificaciones/actions'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { notificationHref, notificationTone } from '@/lib/notification-links'
import { cn } from '@/lib/utils'

type Item = { id: number; type: string; title: string; body: string; data: Record<string, unknown> | null; read_at: string | null; created_at: string }

const DOT = { bad: 'bg-destructive', warn: 'bg-warning', ok: 'bg-success', info: 'bg-primary' } as const
const POLL_MS = 60_000

/**
 * Campanita (FRO-26): las notificaciones del usuario en este club. Se actualiza cada 60 s y al
 * cambiar de pantalla. Tocar una la marca leída y lleva a lo que corresponde.
 */
export function NotificationBell({ club }: { club: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/c/${club}/notificaciones`, { cache: 'no-store' })
      if (!response.ok) return
      const body = (await response.json()) as { items: Item[]; unread: number }
      setItems(body.items)
      setUnread(body.unread)
    } catch {
      // Sin red: queda lo último que se cargó.
    }
  }, [club])

  useEffect(() => {
    const first = setTimeout(load, 0)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, POLL_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [load, pathname])

  const open = async (item: Item) => {
    if (!item.read_at) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read_at: new Date().toISOString() } : i)))
      setUnread((n) => Math.max(0, n - 1))
      void markReadAction(item.id)
    }
    const href = notificationHref(club, item)
    if (href) router.push(href)
  }

  const readAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
    setUnread(0)
    if (!(await markAllReadAction())) load()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative size-9" />}
        aria-label={unread > 0 ? `Notificaciones: ${unread} sin leer` : 'Notificaciones'}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground ring-2 ring-card tabular-nums" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2 border-b px-3 py-2.5 text-foreground">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Marcar todas como leídas
              </button>
            )}
          </DropdownMenuLabel>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            {items.map((item) => (
              <DropdownMenuItem key={item.id} onClick={() => open(item)} className={cn('items-start gap-2.5 rounded-md px-2.5 py-2.5', !item.read_at && 'bg-primary/5')}>
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.read_at ? 'bg-muted-foreground/30' : DOT[notificationTone(item.type)])} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm leading-snug', !item.read_at && 'font-medium')}>{item.title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
                  <span className="text-[11px] text-muted-foreground/80">{timeAgo(item.created_at)}</span>
                </span>
              </DropdownMenuItem>
            ))}
            {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No tenés notificaciones.</p>}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const RELATIVE = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })
function timeAgo(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour')
  return RELATIVE.format(Math.round(hours / 24), 'day')
}
