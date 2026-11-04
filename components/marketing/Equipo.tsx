import React from 'react'
import Image from 'next/image'

export interface MiembroEquipo {
  nombre: string
  rol: string
  inicial: string
  descripcion: string
  imagen?: string
}

export const miembrosEquipo: MiembroEquipo[] = [
  {
    nombre: 'Martín',
    rol: 'Arquitectura de Base de Datos y Gestión ABM',
    inicial: 'M',
    imagen: '/images/equipo/martin.jpg',
    descripcion:
      'Colaboró en la arquitectura de datos y lideró la construcción de los módulos ABM. Optimizó los flujos de carga y validaciones para garantizar un registro muy ágil y robusto.',
  },
  {
    nombre: 'Sofía',
    rol: 'Arquitectura de Base de Datos',
    inicial: 'S',
    imagen: '/images/equipo/sofia.jpg',
    descripcion:
      'Estructuró el modelo de datos relacional y el esquema multitenant del club. Aseguró la total integridad referencial y la optimización de consultas para cada ficha y plantel.',
  },
  {
    nombre: 'Facundo',
    rol: 'Desarrollo Backend y APIs',
    inicial: 'F',
    imagen: '/images/equipo/facundo.jpg',
    descripcion:
      'Lideró el desarrollo del servidor y la arquitectura de APIs en Laravel. Implementó la autenticación por roles, permisos y endpoints centrales con gran solidez y rendimiento.',
  },
  {
    nombre: 'Tiziano',
    rol: 'Desarrollo Frontend y UI/UX',
    inicial: 'T',
    imagen: '/images/equipo/tiziano.jpg',
    descripcion:
      'Construyó la aplicación web interactiva utilizando Next.js y Tailwind CSS. Diseñó pantallas fluidas y muy accesibles, conectando cada flujo al backend con una total solidez.',
  },
]

export function Equipo() {
  return (
    <section className="relative w-full bg-[#111110] py-24 px-6 sm:px-12 text-white border-t border-zinc-800/80 overflow-hidden">
      {/* Fondo decorativo vectorizado con next/image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/images/court-pattern.svg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111110] via-transparent to-[#111110]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Encabezado de la sección */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8643C] mb-3">
            Quiénes somos
          </span>
          <h2 className="font-barlow text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white">
            El equipo detrás de Sportiva
          </h2>
          <p className="mt-4 max-w-2xl text-base text-zinc-300 leading-relaxed">
            Un equipo multidisciplinario enfocado en construir tecnología robusta, moderna y accesible para la gestión diaria de los clubes.
          </p>
        </div>

        {/* Grid responsivo parejo: 1 columna en móvil, 2 en tablet, 4 en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {miembrosEquipo.map((miembro) => (
            <article
              key={miembro.nombre}
              className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-7 flex flex-col items-center text-center h-full transition-all duration-300 hover:border-[#C8643C]/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 group bg-cover bg-center" style={{ backgroundImage: "url('/images/quienes-somos-bg.jpg')" }}
            >
              <div className="flex flex-col items-center w-full">
                {/* Círculo para avatar / foto */}
                <div className="relative w-24 h-24 rounded-full bg-zinc-800/90 border-2 border-zinc-700/80 flex items-center justify-center text-2xl font-bold text-[#C8643C] group-hover:border-[#C8643C] group-hover:scale-105 transition-all duration-300 shadow-inner overflow-hidden shrink-0">
                  {miembro.imagen ? (
                    <Image
                      src={miembro.imagen}
                      alt={miembro.nombre}
                      fill
                      sizes="96px"
                      className="object-cover object-center"
                    />
                  ) : (
                    miembro.inicial
                  )}
                </div>

                {/* Nombre */}
                <h3 className="mt-4 text-xl font-bold text-white tracking-wide leading-tight">
                  {miembro.nombre}
                </h3>

                {/* Rol calibrado con altura fija unificada */}
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C8643C] h-12 flex items-center justify-center text-center text-balance leading-snug">
                  {miembro.rol}
                </span>
              </div>

              {/* Contenedor de descripción con inicio y final perfectamente alineados */}
              <div className="w-full border-t border-zinc-800/80 pt-4 mt-3 flex-1 flex flex-col justify-start">
                <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed text-left">
                  {miembro.descripcion}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Equipo
