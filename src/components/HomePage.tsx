'use client'

import { FormEvent, ReactNode, useRef, useState } from 'react'
import Link from 'next/link'
import { submitTicket } from '@/lib/actions/tickets'
import { NewsletterForm } from './SiteChrome'

const heroImage = '/hero-court.jpg'

function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M8 5h11v11" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="9.5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9V6.8a4 4 0 0 1 8 0V9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  )
}

function Brand({ light = true }: { light?: boolean }) {
  return (
    <Link className={`brand ${light ? 'brand--light' : ''}`} href="/" aria-label="Sportiva, inicio">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand-word">
        sport<span>i</span>va
      </span>
    </Link>
  )
}

type Feature = {
  kicker: string
  title: string
  accent: string
  preview: ReactNode
}

const features: Feature[] = [
  {
    kicker: 'Plantel',
    title: 'Fichas médicas y jugadores',
    accent: '#d36f45',
    preview: (
      <div className="player-preview" aria-hidden="true">
        <div className="preview-topline">
          <span>Jugadores</span>
          <b>+ Agregar</b>
        </div>
        <div className="player-row">
          <span className="avatar">LM</span>
          <span><b>Lucas Méndez</b><small>Delantero · Primera</small></span>
          <i className="status-dot" />
        </div>
        <div className="player-row muted-row">
          <span className="avatar">TS</span>
          <span><b>Tomás Silva</b><small>Mediocampo · Primera</small></span>
          <i className="status-dot warning" />
        </div>
      </div>
    ),
  },
  {
    kicker: 'Agenda',
    title: 'Calendario y asistencia',
    accent: '#dfc5a7',
    preview: (
      <div className="calendar-preview" aria-hidden="true">
        <div className="preview-topline">
          <span>Marzo 2025</span>
          <b>Hoy</b>
        </div>
        <div className="calendar-days">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}
          {[10, 11, 12, 13, 14, 15, 16].map((day) => <b className={day === 13 ? 'active-day' : ''} key={day}>{day}</b>)}
        </div>
        <div className="event-line"><i /><span><b>Entrenamiento Primera</b><small>18:30 · Cancha 2</small></span></div>
      </div>
    ),
  },
  {
    kicker: 'Inventario',
    title: 'Control de utilería',
    accent: '#d36f45',
    preview: (
      <div className="stock-preview" aria-hidden="true">
        <div className="preview-topline">
          <span>Inventario</span>
          <b>82%</b>
        </div>
        <div className="stock-item"><span>Pelotas oficiales</span><b>24 / 30</b></div>
        <div className="progress"><i style={{ width: '80%' }} /></div>
        <div className="stock-item"><span>Conos de entrenamiento</span><b>42 / 50</b></div>
        <div className="progress"><i style={{ width: '72%' }} /></div>
      </div>
    ),
  },
]

export type HomePageProps = {
  hasSession?: boolean
}

export default function HomePage({ hasSession = false }: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCards = (direction: number) => {
    carouselRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('subject', 'Solicitud de demo desde la home')
    setSent(true)
    try {
      await submitTicket({ ok: false }, formData)
    } catch {
      // optimistic success UI
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand />
        <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Navegación principal">
          <Link href="/funciones" onClick={() => setMenuOpen(false)}>Funciones</Link>
          <Link href="/quienes-somos" onClick={() => setMenuOpen(false)}>Quiénes somos</Link>
          <Link href="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
        </nav>
        <Link className="header-cta" href={hasSession ? '/clubes' : '/login'}>
          <span>{hasSession ? 'Ir a mis clubes' : 'Iniciar sesión'}</span>
          <ArrowUpRight />
        </Link>
        <button
          className={menuOpen ? 'menu-button is-open' : 'menu-button'}
          type="button"
          aria-expanded={menuOpen}
          aria-label="Abrir menú"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <i /><i />
        </button>
      </header>

      <main>
        <section className="hero" id="inicio" style={{ '--hero-image': `url(${heroImage})` } as React.CSSProperties}>
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="eyebrow">
              <i />
              <span>Plataforma de gestión operativa para clubes</span>
            </div>

            <h1>
              Toda la operación de tu club
              <br />
              <em>en un solo tablero.</em>
            </h1>

            <p>
              Partidos, fichas médicas, profes, utilería e instalaciones organizados en tiempo real.
              Sin planillas perdidas ni cadenas de mensajes desordenadas.
            </p>

            <div className="hero-cta-group">
              <Link className="primary-cta" href={hasSession ? '/clubes' : '/login'}>
                <span>{hasSession ? 'Ir a mis clubes' : 'Empezá a gestionar tu club hoy'}</span>
                <ArrowUpRight />
              </Link>

              <div className="trust-line">
                <div className="avatar-stack">
                  <span>RB</span>
                  <span>CA</span>
                  <span>+8</span>
                </div>
                <p>
                  <strong>Todo el club, alineado.</strong>
                  <br />
                  Desde la comisión hasta la cancha.
                </p>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#funciones" aria-label="Ver funciones">
            <span>Descubrí Sportiva</span>
            <i />
          </a>
          <div className="hero-stat">
            <span className="live-dot" />
            <p><b>En vivo</b><br />La operación de hoy</p>
            <strong>12</strong>
            <small>tareas activas</small>
          </div>
        </section>

        <section className="features-section" id="funciones">
          <div className="section-heading">
            <div>
              <span className="section-index">01 / Funciones</span>
              <h2>EL CONTROL QUE TU CLUB<br /><em>ESTABA PIDIENDO.</em></h2>
            </div>
            <div className="teaser-copy">
              <i className="mini-lock"><LockIcon /></i>
              <p>
                {hasSession ? (
                  <>Tu sesión está activa. <strong>Accedé a tus clubes para gestionar la operación.</strong></>
                ) : (
                  <>Tus herramientas están listas. <strong>Iniciá sesión para desbloquear el control total de tu club.</strong></>
                )}
              </p>
            </div>
          </div>

          <div className="carousel-wrap">
            <div className="feature-carousel" ref={carouselRef}>
              {features.map((feature, index) => (
                <article className="feature-card" key={feature.title} style={{ '--accent': feature.accent } as React.CSSProperties}>
                  <div className="card-number">0{index + 1}</div>
                  <div className="product-preview">{feature.preview}</div>
                  <div className="glass-lock">
                    <span><LockIcon /></span>
                  </div>
                  <div className="card-content">
                    <span>{feature.kicker}</span>
                    <h3>{feature.title}</h3>
                  </div>
                  <Link className="unlock-cta" href={hasSession ? '/clubes' : '/login'}>
                    {hasSession ? 'Ir a mis clubes' : 'Ingresar para ver más'} <ArrowUpRight />
                  </Link>
                </article>
              ))}
            </div>
            <div className="carousel-controls">
              <button type="button" onClick={() => scrollCards(-1)} aria-label="Tarjetas anteriores">←</button>
              <div><i /><span>Deslizá para explorar</span></div>
              <button type="button" onClick={() => scrollCards(1)} aria-label="Tarjetas siguientes">→</button>
            </div>
          </div>
        </section>

        <section className="why-section" id="nosotros">
          <div className="why-label"><span>02</span><p>Por qué<br />Sportiva</p></div>
          <div className="why-copy">
            <span className="quote-mark">“</span>
            <h2>Sabemos lo que cuesta<br />coordinar un club <em>a pulmón.</em></h2>
            <p>Sportiva automatiza lo aburrido para que tu equipo se enfoque en lo que realmente importa: <strong>crecer, competir y ganar.</strong></p>
          </div>
          <div className="score-block" aria-hidden="true">
            <div><small>Administración</small><b>10</b></div>
            <span>—</span>
            <div><small>Caos operativo</small><b>00</b></div>
          </div>
        </section>

        <section className="access-section" id="acceso">
          <div className="access-orbit"><span /><span /></div>
          <span className="section-index">Tu próxima jugada</span>
          <h2>MENOS CAOS.<br /><em>MÁS CLUB.</em></h2>
          <p>Centralizá la operación y recuperá tiempo para hacer crecer a tu equipo.</p>
          <Link className="primary-cta primary-cta--dark" href="/contacto">
            <span>Quiero conocer Sportiva</span><ArrowUpRight />
          </Link>
        </section>
      </main>

      <footer id="contacto">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand />
            <p>La plataforma operativa que convierte el esfuerzo de todos los días en un club mejor organizado.</p>
            <div className="social-links">
              <a href="#" aria-label="Instagram">Ig</a>
              <a href="#" aria-label="LinkedIn">Li</a>
              <a href="#" aria-label="X">X</a>
            </div>
          </div>
          <div className="footer-nav">
            <span>Explorá</span>
            <Link href="/funciones">Funciones</Link>
            <Link href="/quienes-somos">Quiénes somos</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href={hasSession ? '/clubes' : '/login'}>
              {hasSession ? 'Ir a mis clubes' : 'Iniciar sesión'}
            </Link>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
          <div className="contact-form-wrap">
            <span>Hablemos de tu club</span>
            <h3>¿Listo para ordenar el juego?</h3>
            {sent ? (
              <div className="success-message" role="status">
                <span>✓</span>
                <p><b>Recibimos tu consulta.</b><br />Pronto vamos a ponernos en contacto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label>
                  <span>Nombre</span>
                  <input required name="name" placeholder="Tu nombre" autoComplete="name" />
                </label>
                <label>
                  <span>Email</span>
                  <input required type="email" name="email" placeholder="vos@tuclub.com" autoComplete="email" />
                </label>
                <button type="submit">Quiero una demo <ArrowUpRight /></button>
              </form>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sportiva</span>
          <span>Hecho para los que hacen club.</span>
          <div><a href="#">Privacidad</a><a href="#">Términos</a></div>
        </div>
      </footer>
    </div>
  )
}