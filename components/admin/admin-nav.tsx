'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Mail, MessageSquare, ScrollText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/admin/usuarios',
    label: 'Usuarios',
    icon: Users,
    active: (path: string) => path.startsWith('/admin/usuarios'),
  },
  {
    href: '/admin/clubes',
    label: 'Clubes',
    icon: Building2,
    active: (path: string) => path.startsWith('/admin/clubes'),
  },
  {
    href: '/admin/tickets',
    label: 'Tickets',
    icon: MessageSquare,
    active: (path: string) => path.startsWith('/admin/tickets'),
  },
  {
    href: '/admin/newsletter',
    label: 'Newsletter',
    icon: Mail,
    active: (path: string) => path.startsWith('/admin/newsletter'),
  },
  {
    href: '/admin/actividad',
    label: 'Actividad',
    icon: ScrollText,
    active: (path: string) => path.startsWith('/admin/actividad'),
  },
]

interface AdminNavProps {
  newTicketsCount?: number
}

export function AdminNav({ newTicketsCount = 0 }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="flex max-w-full items-center gap-1 overflow-x-auto pb-0.5 sm:gap-2 md:overflow-visible md:pb-0"
      aria-label="Navegación del panel"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = item.active(pathname)
        const showBadge = item.href === '/admin/tickets' && newTicketsCount > 0

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
            {showBadge && (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300',
                )}
                aria-label={`${newTicketsCount} tickets nuevos`}
              >
                {newTicketsCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
