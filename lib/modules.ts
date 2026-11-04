import {
  CalendarDays,
  UserCog,
  Megaphone,
  ClipboardCheck,
  Package,
  ShieldCheck,
  Shirt,
  Target,
  TrendingUp,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export type ModuleId =
  | 'habilitacion'
  | 'indumentaria'
  | 'materiales'
  | 'partidos'
  | 'jugadores'
  | 'analisis'
  | 'competencia'
  | 'profes'
  | 'canchas'
  | 'comunicados'
  | 'equipo'

export type ModuleDef = {
  id: ModuleId
  name: string
  description: string
  icon: LucideIcon
  area: 'Deportivo' | 'Operación' | 'Infraestructura'
  /**
   * Permisos `*.view` que habilitan el módulo: alcanza con tener uno. Tienen que ser los mismos
   * que pide la página del módulo; si no, aparece en el menú y al entrar dice "Sin acceso".
   * El primero es la clave principal (docs/roles-y-permisos.md de la API).
   */
  permissions: readonly string[]
  /** Permisos de trabajo (cargar, pedir, registrar): con uno, el módulo es parte de "Tu trabajo" en el inicio. */
  actions: readonly string[]
}

export const MODULES: ModuleDef[] = [
  { id: 'partidos', name: 'Partidos', description: 'Fixture, horarios, sedes y ropa de juego', icon: CalendarDays, area: 'Deportivo', permissions: ['matches.view', 'trainings.view'], actions: ['matches.create', 'matches.update', 'trainings.create', 'trainings.update', 'attendance.record', 'callups.update'] },
  { id: 'habilitacion', name: 'Habilitación', description: 'Quién puede jugar y qué papeles le faltan', icon: ShieldCheck, area: 'Deportivo', permissions: ['player_requirements.view'], actions: ['player_requirements.update', 'player_documents.upload'] },
  { id: 'jugadores', name: 'Jugadores', description: 'Fichas, categorías, pases y puestos', icon: Users, area: 'Deportivo', permissions: ['players.view'], actions: ['players.create', 'players.update'] },
  { id: 'analisis', name: 'Análisis', description: 'Eficacia, constancia y práctica', icon: TrendingUp, area: 'Deportivo', permissions: ['physical_evaluations.view'], actions: ['physical_evaluations.create', 'physical_evaluations.update'] },
  { id: 'competencia', name: 'Proyecto', description: 'Objetivos, tabla y estadísticas', icon: Target, area: 'Deportivo', permissions: ['project.view'], actions: ['project.update'] },
  { id: 'profes', name: 'Profes', description: 'Asistencia, cumplimiento y seguimiento', icon: ClipboardCheck, area: 'Operación', permissions: ['coaches.view'], actions: ['coaches.create', 'coaches.update', 'categories.manage_coaches'] },
  { id: 'indumentaria', name: 'Indumentaria', description: 'Pedidos por talle, número y alias', icon: Shirt, area: 'Operación', permissions: ['apparel_orders.view', 'apparel_items.view'], actions: ['apparel_orders.create', 'apparel_orders.approve', 'apparel_orders.deliver', 'apparel_items.create', 'apparel_items.update'] },
  { id: 'materiales', name: 'Materiales', description: 'Stock y reposición de utilería', icon: Package, area: 'Operación', permissions: ['inventory.view', 'material_orders.view', 'materials.view'], actions: ['material_orders.create', 'material_orders.approve', 'material_orders.deliver', 'inventory.adjust', 'inventory.transfer', 'materials.create'] },
  { id: 'canchas', name: 'Canchas', description: 'Estado, limpieza y mantenimiento', icon: Warehouse, area: 'Infraestructura', permissions: ['facilities.view', 'repairs.view', 'maintenance.view'], actions: ['repairs.create', 'repairs.update', 'maintenance.create', 'maintenance.update', 'facilities.update'] },
  { id: 'comunicados', name: 'Comunicados', description: 'Mails a jugadores, tutores y staff', icon: Megaphone, area: 'Operación', permissions: ['announcements.view'], actions: ['announcements.send'] },
  { id: 'equipo', name: 'Equipo', description: 'Staff del club, sus roles y su acceso', icon: UserCog, area: 'Operación', permissions: ['club_users.view'], actions: ['club_users.invite', 'club_users.update', 'roles.assign'] },
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

/**
 * Accesos del inicio según el rol: "Tu trabajo" son los módulos donde puede cargar, pedir o
 * registrar algo; el resto de lo que ve queda para consultar.
 */
export function homeShortcuts(permissions: readonly string[]) {
  const visible = visibleModules(permissions)
  const works = (m: ModuleDef) => m.actions.some((key) => permissions.includes(key))
  return { work: visible.filter(works), consult: visible.filter((m) => !works(m)) }
}

/** La misma regla del menú para la página del módulo: si el menú lo muestra, la página deja entrar. */
export function canOpenModule(id: ModuleId, permissions: readonly string[]) {
  const mod = getModule(id)
  return mod !== undefined && canSeeModule(mod, permissions)
}
