'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Alterna entre el tema claro y el oscuro. El ícono lo elige el CSS (clase `dark` en <html>),
 * así se ve bien desde el primer render, antes de que el cliente conozca el tema.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Cambiar entre tema claro y oscuro"
      title="Tema claro u oscuro"
      className={cn('size-9 cursor-pointer', className)}
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}
