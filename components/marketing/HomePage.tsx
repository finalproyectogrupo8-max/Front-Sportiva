'use client'

import { ReactNode, useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import HeroVideoBackground from './HeroVideoBackground'
import Link from 'next/link'
import { submitDemoRequest, type DemoRequestState } from '@/lib/actions/tickets'
import Brand from './Brand'
import { Honeypot, NewsletterForm } from './SiteChrome'

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
    accent: '#d36f45',
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
  // Server Action: termina en un ticket (POST /api/tickets) que el admin ve en /admin/tickets.
  const [demo, demoAction, demoPending] = useActionState<DemoRequestState, FormData>(submitDemoRequest, { ok: false })
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCards = (direction: number) => {
    carouselRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' })
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
          <span>Iniciar sesión</span>
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
        <section className="hero" id="inicio">
          <div className="hero-background-wrap">
            <HeroVideoBackground fallbackImage={heroImage} />

          </div>

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

            <p className="hero-lead">
              Partidos, fichas médicas, profes, utilería e instalaciones organizados en tiempo real.
              Sin planillas perdidas ni cadenas de mensajes desordenadas.
            </p>

            <div className="hero-cta-group">
              <Link className="primary-cta" href={hasSession ? '/clubes' : '/login'}>
                <span>{hasSession ? 'Ir a mis clubes' : 'Empezá a gestionar tu club hoy'}</span>
                <ArrowUpRight />
              </Link>

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
                <article
                  className="feature-card"
                  key={feature.title}
                  style={{ '--accent': feature.accent, '--card-index': index } as React.CSSProperties}
                >
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

          </div>
        </section>

        <section className="why-section" id="quienes-somos">
          <span id="nosotros" className="sr-only" />
          <div className="why-background">
            <Image
              src="/images/fondo-quienes-somos.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-20 pointer-events-none"
            />
          </div>
          <div className="why-grid-container">
            <div className="why-left-col">
              <div className="why-label"><span>02</span><p>Por qué<br />Sportiva</p></div>
              <div className="why-copy">
                <span className="quote-mark">“</span>
                <h2>Sabemos lo que cuesta<br />coordinar un club <em>a pulmón.</em></h2>
                <p>Sportiva automatiza lo aburrido para que tu equipo se enfoque en lo que realmente importa: <strong>crecer, competir y ganar.</strong></p>
              </div>
            </div>
            <div className="why-right-col" aria-hidden="true">
              <div className="score-block">
                <div><small>Administración eficiente</small><b>10</b></div>
                <span>—</span>
                <div><small>Caos operativo</small><b>00</b></div>
              </div>
              <div className="why-features-badge">
                <span>✓ 0 planillas duplicadas</span>
                <span>✓ 100% trazabilidad de materiales</span>
                <span>✓ Fichas médicas al instante</span>
              </div>
            </div>
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

      <footer id="contacto" className="relative overflow-hidden bg-[#0d0d0c]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/contact-stadium.jpg"
            alt="Estadio Sportiva"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c]/90 via-[#0d0d0c]/60 to-[#0d0d0c]/75" />
        </div>
        <div className="footer-main relative z-10">
          <div className="footer-brand">
            <Brand />
            <p>La plataforma operativa que convierte el esfuerzo de todos los días en un club mejor organizado.</p>
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
            {demo.ok ? (
              <div className="success-message" role="status">
                <span>✓</span>
                <p><b>Recibimos tu consulta.</b><br />Pronto vamos a ponernos en contacto.</p>
              </div>
            ) : (
              <form action={demoAction} noValidate>
                <input type="hidden" name="subject" value="Solicitud de demo desde la home" />
                <Honeypot />
                <label>
                  <span>Nombre</span>
                  <input required name="name" placeholder="Tu nombre" autoComplete="name" defaultValue={demo.values?.name} />
                  {demo.errors?.name && <small className="route-form-error">{demo.errors.name[0]}</small>}
                </label>
                <label>
                  <span>Email</span>
                  <input required type="email" name="email" placeholder="vos@tuclub.com" autoComplete="email" defaultValue={demo.values?.email} />
                  {demo.errors?.email && <small className="route-form-error">{demo.errors.email[0]}</small>}
                </label>
                {demo.message && !demo.ok && !demo.errors && (
                  <p className="route-form-error" role="alert">{demo.message}</p>
                )}
                <button type="submit" disabled={demoPending}>
                  {demoPending ? 'Enviando...' : <>Quiero una demo <ArrowUpRight /></>}
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="footer-bottom relative z-10">
          <span>© {new Date().getFullYear()} Sportiva</span>
          <span>Hecho para los que hacen club.</span>
          <div><a href="#">Privacidad</a><a href="#">Términos</a></div>
        </div>
      </footer>
    </div>
  )
}