'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutDashboard, LogIn, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HomeHeaderProps {
  hasSession: boolean
}

export function HomeHeader({ hasSession }: HomeHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '#funciones', label: 'Funciones' },
    { href: '#nosotros', label: 'Quiénes somos' },
    { href: '#contacto', label: 'Contacto' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {hasSession ? (
            <Link
              href="/clubes"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'gap-2 bg-ink text-ink-foreground hover:bg-ink/90 font-medium',
              )}
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              <span>Ir a mis clubes</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium',
              )}
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span>Ingresar</span>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            className="p-2"
          >
            {mobileMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border/60 bg-background px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-border/40">
              {hasSession ? (
                <Link
                  href="/clubes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'w-full justify-center gap-2 bg-ink text-ink-foreground',
                  )}
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  <span>Ir a mis clubes</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'w-full justify-center gap-2 bg-brand text-brand-foreground',
                  )}
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  <span>Ingresar a mi club</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
