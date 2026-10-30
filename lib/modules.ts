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
  /**
   * Permisos `*.view` que habilitan el módulo: alcanza con tener uno.
   * El primero es la clave principal (docs/roles-y-permisos.md de la API).
   */
  permissions: readonly string[]
}

export const MODULES: ModuleDef[] = [
  { id: 'partidos', name: 'Partidos', description: 'Fixture, horarios, sedes y ropa de juego', icon: CalendarDays, area: 'Deportivo', permissions: ['matches.view', 'trainings.view', 'attendance.view'] },
  { id: 'jugadores', name: 'Jugadores', description: 'Fichas, categorías, pases y puestos', icon: Users, area: 'Deportivo', permissions: ['players.view'] },
  { id: 'analisis', name: 'Análisis', description: 'Eficacia, constancia y práctica', icon: TrendingUp, area: 'Deportivo', permissions: ['physical_evaluations.view'] },
  { id: 'competencia', name: 'Proyecto', description: 'Objetivos, tabla y estadísticas', icon: Target, area: 'Deportivo', permissions: ['project.view'] },
  { id: 'profes', name: 'Profes', description: 'Asistencia, cumplimiento y seguimiento', icon: ClipboardCheck, area: 'Operación', permissions: ['coaches.view'] },
  { id: 'indumentaria', name: 'Indumentaria', description: 'Pedidos por talle, número y alias', icon: Shirt, area: 'Operación', permissions: ['apparel_orders.view', 'apparel_items.view'] },
  { id: 'materiales', name: 'Materiales', description: 'Stock y reposición de utilería', icon: Package, area: 'Operación', permissions: ['inventory.view', 'material_orders.view', 'materials.view'] },
  { id: 'canchas', name: 'Canchas', description: 'Estado, limpieza y mantenimiento', icon: Warehouse, area: 'Infraestructura', permissions: ['facilities.view', 'repairs.view', 'maintenance.view'] },
]

/** Altas rápidas (top bar y buscador): cada una pide el permiso de crear en su recurso. */
export const QUICK_CREATE: readonly { module: ModuleId; label: string; action: string; permission: string }[] = [
  { module: 'indumentaria', label: 'Pedido de indumentaria', action: 'Nuevo pedido de indumentaria', permission: 'apparel_orders.create' },
  { module: 'materiales', label: 'Solicitud de materiales', action: 'Solicitar reposición de materiales', permission: 'material_orders.create' },
  { module: 'partidos', label: 'Partido', action: 'Cargar partido', permission: 'matches.create' },
  { module: 'jugadores', label: 'Ficha de jugador', action: 'Nueva ficha de jugador', permission: 'players.create' },
  { module: 'canchas', label: 'Reporte de cancha', action: 'Reportar problema en cancha', permission: 'repairs.create' },
]

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id)
}

/** Si el usuario ve el módulo con sus permisos del club. */
export function canSeeModule(mod: ModuleDef, permissions: readonly string[]) {
  return mod.permissions.some((key) => permissions.includes(key))
}

/** Módulos que el usuario puede ver, en el orden del menú. */
export function visibleModules(permissions: readonly string[]) {
  return MODULES.filter((m) => canSeeModule(m, permissions))
}
