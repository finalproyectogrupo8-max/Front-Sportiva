import type { Metadata } from 'next'
import InternalPage from '@/components/InternalPage'

export const metadata: Metadata = {
  title: 'Funciones',
  description: 'Todas las herramientas para gestionar la operación diaria de tu club.',
}

const items = [
  { index: '01', title: 'Jugadores y fichas médicas', description: 'Información deportiva, contactos y aptos médicos siempre disponibles y ordenados.', detail: '124 fichas al día' },
  { index: '02', title: 'Calendario y asistencia', description: 'Entrenamientos, partidos, convocatorias y asistencia sincronizados en tiempo real.', detail: 'Práctica · 18:30' },
  { index: '03', title: 'Profes y equipos', description: 'Roles, planteles y responsables claros para que cada persona sepa qué tiene que hacer.', detail: '8 profes activos' },
  { index: '04', title: 'Utilería e inventario', description: 'Stock, préstamos y alertas para cuidar cada recurso del club.', detail: '82% disponible' },
  { index: '05', title: 'Instalaciones', description: 'Reservas de canchas y espacios sin cruces, mensajes o planillas paralelas.', detail: '3 canchas libres' },
  { index: '06', title: 'Reportes operativos', description: 'Decisiones con datos concretos y una visión completa de lo que pasa hoy.', detail: 'Actualizado ahora' },
]

export default function FuncionesPage() {
  return (
    <InternalPage
      eyebrow="Una plataforma. Todo tu club."
      title="LAS HERRAMIENTAS"
      outline="QUE ORDENAN EL JUEGO."
      description="Sportiva conecta personas, tareas y recursos para que la operación diaria deje de depender de la memoria y los grupos de chat."
      items={items}
      statement="MÁS VISIBILIDAD."
      statementAccent="MEJORES DECISIONES."
    />
  )
}