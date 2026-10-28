'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
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
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación del panel">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = item.active(pathname)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
