'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Alterna entre el tema claro y el oscuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // El tema se conoce recién en el cliente: hasta montar se muestra un botón neutro.
  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Usar tema claro' : 'Usar tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
      className={cn('size-9 cursor-pointer', className)}
    >
      {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </Button>
  )
}
