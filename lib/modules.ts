import {
  CalendarDays,
  ClipboardCheck,
  Package,
  Shirt,
  Target,
  TrendingUp,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export type ModuleId =
  | 'indumentaria'
  | 'materiales'
  | 'partidos'
  | 'jugadores'
  | 'analisis'
  | 'competencia'
  | 'profes'
  | 'canchas'

export type ModuleDef = {
  id: ModuleId
  name: string
  description: string
  icon: LucideIcon
  area: 'Deportivo' | 'Operación' | 'Infraestructura'
}

export const MODULES: ModuleDef[] = [
  { id: 'partidos', name: 'Partidos', description: 'Fixture, horarios, sedes y ropa de juego', icon: CalendarDays, area: 'Deportivo' },
  { id: 'jugadores', name: 'Jugadores', description: 'Fichas, categorías, pases y puestos', icon: Users, area: 'Deportivo' },
  { id: 'analisis', name: 'Análisis', description: 'Eficacia, constancia y práctica', icon: TrendingUp, area: 'Deportivo' },
  { id: 'competencia', name: 'Proyecto', description: 'Objetivos, tabla y estadísticas', icon: Target, area: 'Deportivo' },
  { id: 'profes', name: 'Profes', description: 'Asistencia, cumplimiento y seguimiento', icon: ClipboardCheck, area: 'Operación' },
  { id: 'indumentaria', name: 'Indumentaria', description: 'Pedidos por talle, número y alias', icon: Shirt, area: 'Operación' },
  { id: 'materiales', name: 'Materiales', description: 'Stock y reposición de utilería', icon: Package, area: 'Operación' },
  { id: 'canchas', name: 'Canchas', description: 'Estado, limpieza y mantenimiento', icon: Warehouse, area: 'Infraestructura' },
]

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id)
}
