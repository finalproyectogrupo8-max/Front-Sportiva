'use client'

import { FormEvent, ReactNode, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { submitTicket } from '@/lib/actions/tickets'
import Brand from './Brand'
import { ArrowUpRight } from './icons'

const nav = [
  { href: '/funciones', label: 'Funciones' },
  { href: '/quienes-somos', label: 'Quiénes somos' },
  { href: '/contacto', label: 'Contacto' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="inner-header">
      <Brand />
      <nav className="inner-nav" aria-label="Navegación principal">
        {nav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </nav>
      <Link className="header-cta" href="/login">
        <span>Ir a mis clubes</span><ArrowUpRight />
      </Link>
      <button
        className={open ? 'menu-button is-open' : 'menu-button'}
        type="button"
        aria-expanded={open}
        aria-label="Abrir menú"
        onClick={() => setOpen((value) => !value)}
      >
        <i /><i />
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-route-nav"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {nav.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('subject', 'Solicitud de contacto desde el sitio')
    setSent(true)
    try {
      await submitTicket({ ok: false }, formData)
    } catch {
      // optimistic
    }
  }

  if (sent) {
    return (
      <motion.div className="route-success" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <b>Consulta recibida.</b>
        <span>Pronto vamos a hablar sobre tu club.</span>
      </motion.div>
    )
  }

  return (
    <form className={compact ? 'route-form compact' : 'route-form'} onSubmit={submit}>
      <label><span>Nombre</span><input required name="name" placeholder="Tu nombre" /></label>
      <label><span>Email</span><input required type="email" name="email" placeholder="vos@tuclub.com" /></label>
      {!compact && <label className="message-field"><span>¿Qué necesita tu club?</span><textarea name="message" placeholder="Contanos brevemente..." /></label>}
      <button type="submit">Quiero una demo <ArrowUpRight /></button>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="route-footer">
      <div>
        <Brand />
        <p>Hecho para los que hacen club.</p>
      </div>
      <div className="route-footer-links">
        {nav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </div>
      <Link className="footer-demo-link" href="/contacto">Solicitar demo <ArrowUpRight /></Link>
    </footer>
  )
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="internal-shell">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}