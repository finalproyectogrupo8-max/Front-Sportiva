import React from 'react'

export interface MiembroEquipo {
  nombre: string
  rol: string
  inicial: string
}

export const miembrosEquipo: MiembroEquipo[] = [
  {
    nombre: 'Facundo',
    rol: 'Desarrollador Backend',
    inicial: 'F',
  },
  {
    nombre: 'Martín',
    rol: 'Arquitectura y Base de Datos',
    inicial: 'M',
  },
  {
    nombre: 'Sofía',
    rol: 'Desarrolladora Frontend',
    inicial: 'S',
  },
  {
    nombre: 'Tiziano',
    rol: 'Desarrollador Full Stack y Diseño UI/UX',
    inicial: 'T',
  },
]

export function Equipo() {
  return (
    <section className="w-full bg-[#111110] py-20 px-6 sm:px-12 text-white border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado de la sección */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8643C] mb-3">
            Quiénes somos
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white">
            El equipo detrás de Sportiva
          </h2>
          <p className="mt-4 max-w-2xl text-base text-zinc-400">
            Un equipo multidisciplinario enfocado en construir tecnología robusta, moderna y accesible para la gestión diaria de los clubes.
          </p>
        </div>

        {/* Grid responsivo: 1 columna en móvil, 4 en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {miembrosEquipo.map((miembro) => (
            <article
              key={miembro.nombre}
              className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#C8643C]/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 group"
            >
              {/* Círculo para avatar / inicial */}
              <div className="w-20 h-20 rounded-full bg-zinc-800/90 border-2 border-zinc-700/80 flex items-center justify-center text-2xl font-bold text-[#C8643C] group-hover:border-[#C8643C] group-hover:scale-105 transition-all duration-300 shadow-inner">
                {miembro.inicial}
              </div>

              {/* Nombre */}
              <h3 className="mt-5 text-xl font-bold text-white tracking-wide">
                {miembro.nombre}
              </h3>

              {/* Rol */}
              <p className="mt-2 text-sm text-zinc-400 font-medium leading-relaxed">
                {miembro.rol}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Equipo

