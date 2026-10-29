'use client'

import { ReactNode, useActionState, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { submitDemoRequest, type DemoRequestState } from '@/lib/actions/tickets'
import { subscribe, type NewsletterState } from '@/lib/actions/newsletter'
import type { AdminActionState } from '@/lib/admin-types'
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
        <span>Iniciar sesión</span><ArrowUpRight />
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

/** Campo trampa para bots: invisible para personas, la API descarta el envío si viene completo. */
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
    />
  )
}

function FieldError({ errors, field }: { errors?: AdminActionState['errors']; field: string }) {
  const message = errors?.[field]?.[0]
  return message ? <small className="route-form-error">{message}</small> : null
}

export function ContactForm({ compact = false }: { compact?: boolean }) {
  // Server Action: el envío va desde el servidor a POST /api/tickets y el admin lo ve en /admin/tickets.
  const [state, action, pending] = useActionState<DemoRequestState, FormData>(submitDemoRequest, { ok: false })
  // React resetea el form después del action: defaultValue + key lo vuelven a llenar si hubo error.
  const v = state.values

  if (state.ok) {
    return (
      <motion.div className="route-success" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <b>Consulta recibida.</b>
        <span>Pronto vamos a hablar sobre tu club.</span>
      </motion.div>
    )
  }

  return (
    <form key={JSON.stringify(v ?? {})} className={compact ? 'route-form compact' : 'route-form'} action={action} noValidate>
      <input type="hidden" name="subject" value="Consulta desde la página de contacto" />
      <Honeypot />
      <label>
        <span>Nombre</span>
        <input required name="name" placeholder="Tu nombre" defaultValue={v?.name} aria-invalid={state.errors?.name ? true : undefined} />
        <FieldError errors={state.errors} field="name" />
      </label>
      <label>
        <span>Email</span>
        <input required type="email" name="email" placeholder="vos@tuclub.com" defaultValue={v?.email} aria-invalid={state.errors?.email ? true : undefined} />
        <FieldError errors={state.errors} field="email" />
      </label>
      {!compact && (
        <label className="message-field">
          <span>¿Qué necesita tu club?</span>
          <textarea name="message" placeholder="Contanos brevemente..." defaultValue={v?.message} aria-invalid={state.errors?.message ? true : undefined} />
          <FieldError errors={state.errors} field="message" />
        </label>
      )}
      {state.message && !state.ok && (
        <p className="route-form-error" role="alert">{state.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Enviando...' : <>Quiero una demo <ArrowUpRight /></>}
      </button>
    </form>
  )
}

export function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribe, { ok: false })

  if (state.ok) {
    return (
      <div className="newsletter-success" role="status">
        <p>¡Gracias por suscribirte a nuestro newsletter!</p>
      </div>
    )
  }

  return (
    <form className="newsletter-form" action={action} noValidate>
      <span className="newsletter-label">Newsletter</span>
      <div className="newsletter-row">
        <input type="email" name="email" placeholder="vos@tuclub.com" required disabled={pending} />
        <button type="submit" disabled={pending}>
          {pending ? 'Suscribiendo...' : 'Suscribirse'}
        </button>
      </div>
      {state.error && (
        <p className="newsletter-error" role="alert">
          {state.error}
        </p>
      )}
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
      <div className="route-footer-right">
        <NewsletterForm />
        <Link className="footer-demo-link" href="/contacto">Solicitar demo <ArrowUpRight /></Link>
      </div>
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