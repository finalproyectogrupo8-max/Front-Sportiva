'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface NavbarProps {
  hasSession?: boolean
}

export function Navbar({ hasSession = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/funciones', label: 'Funciones' },
    { href: '/quienes-somos', label: 'Quiénes somos' },
    { href: '/contacto', label: 'Contacto' },
  ]

  return (
    // Contenedor padre con máscara sólida superior para tapar líneas del fondo
    <div className="absolute top-0 left-0 w-full z-50">
      {/* Máscara sólida superior */}
      <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-[#0A0A09] via-[#0A0A09]/90 to-transparent pointer-events-none" />

      {/* Header flotante tipo píldora */}
      <header className="relative w-full pt-6 px-4 sm:px-6 flex justify-center">
        {/* Contenedor de la píldora con fondo sólido oscuro sin transparencias */}
        <div className="w-full max-w-[1360px] h-[76px] px-6 sm:px-8 bg-[#1A1A1A] border border-white/10 rounded-full shadow-2xl shadow-black/80 flex items-center justify-between">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-3 transition-transform hover:scale-105"
            aria-label="Sportiva, inicio"
          >
            <span className="relative block w-[34px] h-[38px]" aria-hidden="true">
              <i className="absolute left-[2px] top-[6px] w-[31px] h-[11px] rounded-[20px] bg-[#C8643C] -rotate-[29deg] transition-transform" />
              <i className="absolute left-[2px] bottom-[5px] w-[31px] h-[11px] rounded-[20px] bg-[#dbc4aa] -rotate-[29deg] transition-transform" />
            </span>
            <span className="text-[32px] font-extrabold tracking-[-1.8px] leading-none text-white">
              sport
              <span className="relative before:content-[''] before:absolute before:w-[5px] before:h-[5px] before:rounded-full before:bg-[#C8643C] before:-top-[2px] before:left-[4px]">
                i
              </span>
              va
            </span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-[15px] font-semibold text-white/75 transition-colors hover:text-white hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Iniciar sesión Desktop */}
          <div className="hidden md:flex items-center">
            <Link
              href={hasSession ? '/clubes' : '/login'}
              className="h-12 inline-flex items-center gap-4 pl-5 pr-1.5 rounded-full border border-white/25 bg-white/5 text-sm font-bold text-white shadow-lg shadow-black/30 transition-all hover:bg-white/15 hover:border-white/50 hover:-translate-y-0.5 group"
            >
              <span>Iniciar sesión</span>
              <span className="w-9 h-9 rounded-full bg-[#C8643C] text-white flex items-center justify-center transition-transform group-hover:rotate-45">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 19 19 5M8 5h11v11" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Botón Menú Móvil */}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex flex-col justify-center items-center gap-1.5 w-11 h-11 rounded-full border border-white/20 bg-[#262626] text-white transition-colors"
          >
            <span
              className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-opacity duration-300 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Drawer móvil con fondo sólido oscuro sin transparencias */}
        {menuOpen && (
          <div className="absolute top-24 left-4 right-4 bg-[#1A1A1A] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 md:hidden z-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-lg font-semibold text-white/90 hover:text-white py-1 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={hasSession ? '/clubes' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 h-11 w-full rounded-full bg-[#C8643C] text-white font-bold text-sm shadow-md transition-colors hover:bg-[#d97349]"
            >
              <span>Iniciar sesión</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 19 19 5M8 5h11v11" />
              </svg>
            </Link>
          </div>
        )}
      </header>
    </div>
  )
}

export default Navbar

