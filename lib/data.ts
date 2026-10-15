import type { Sport, Tenant } from './tenants'

export const TODAY = new Date('2026-09-29T12:00:00-03:00')

export type Categoria = 'Sub-13' | 'Sub-15' | 'Sub-17' | 'Sub-19' | 'Primera'
export const CATEGORIAS: Categoria[] = ['Sub-13', 'Sub-15', 'Sub-17', 'Sub-19', 'Primera']

export type Pase = 'Habilitado' | 'En trámite' | 'A préstamo' | 'Libre'

export const PUESTOS: Record<Sport, string[]> = {
  Básquet: ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'],
  Fútbol: ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'],
  Vóley: ['Armador', 'Opuesto', 'Central', 'Punta', 'Líbero'],
}

export type Player = {
  id: string
  nombre: string
  apellido: string
  edad: number
  deporte: Sport
  categoria: Categoria
  puesto: string
  pase: Pase
  numero: number
  alias: string
  talle: string
  eficacia: number
  constancia: number
  practica: number
  fisico: number
  tactica: number
  asistencia: number
  coachId: string
  evolucion: number[]
}

export type Prenda = 'Camiseta' | 'Short' | 'Buzo' | 'Campera' | 'Medias'
export type EstadoPedido = 'Solicitado' | 'En producción' | 'Listo' | 'Entregado'
export const ESTADOS_PEDIDO: EstadoPedido[] = ['Solicitado', 'En producción', 'Listo', 'Entregado']
export const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export type ApparelOrder = {
  id: string
  playerId: string
  prenda: Prenda
  talle: string
  numero: number
  alias: string
  estado: EstadoPedido
  fecha: string
}

export type Material = {
  id: string
  nombre: string
  tipo: 'Pelotas' | 'Conos' | 'Pesas' | 'Colchonetas' | 'Entrenamiento'
  deporte: Sport | 'General'
  stock: number
  minimo: number
  ubicacion: string
}

export type Urgencia = 'Baja' | 'Media' | 'Alta'
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Recibida'
export type MaterialRequest = {
  id: string
  materialId: string
  cantidad: number
  urgencia: Urgencia
  solicitante: string
  estado: EstadoSolicitud
  fecha: string
  motivo: string
}

export type Match = {
  id: string
  deporte: Sport
  categoria: Categoria
  torneo: string
  rival: string
  condicion: 'Local' | 'Visitante'
  fecha: string
  hora: string
  lugar: string
  direccion: string
  camiseta: string
  short: string
  resultado?: { pf: number; pc: number }
}

export type StandingRow = {
  equipo: string
  pj: number
  pg: number
  pp: number
  pf: number
  pc: number
  propio?: boolean
}
export type Standing = { torneo: string; deporte: Sport; categoria: Categoria; rows: StandingRow[] }

export type Objective = {
  id: string
  titulo: string
  deporte: Sport
  meta: number
  actual: number
  unidad: string
}

export type CoachNote = { fecha: string; playerId: string; texto: string; tipo: 'Mejora' | 'Alerta' | 'Seguimiento' }
export type Coach = {
  id: string
  nombre: string
  deporte: Sport
  categorias: Categoria[]
  planificadas: number
  dictadas: number
  cumplimiento: number
  semana: (boolean | null)[]
  notas: CoachNote[]
}

export type EstadoElemento = 'ok' | 'revisar' | 'fuera'
export type CourtElement = { id: string; nombre: string; estado: EstadoElemento; nota?: string; revisado: string }
export type Court = {
  id: string
  nombre: string
  deporte: Sport | 'Multiuso'
  superficie: string
  limpieza: { estado: 'Hecha' | 'Pendiente'; ultima: string; responsable: string }
  elementos: CourtElement[]
}

export type Incident = {
  id: string
  courtId: string
  elemento: string
  descripcion: string
  prioridad: Urgencia
  estado: 'Abierto' | 'En curso' | 'Resuelto'
  fecha: string
}

export type ClubData = {
  players: Player[]
  orders: ApparelOrder[]
  materials: Material[]
  requests: MaterialRequest[]
  matches: Match[]
  standings: Standing[]
  objectives: Objective[]
  coaches: Coach[]
  courts: Court[]
  incidents: Incident[]
}

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const NOMBRES = [
  'Tomás', 'Mateo', 'Santiago', 'Valentín', 'Joaquín', 'Benjamín', 'Lautaro', 'Thiago', 'Facundo', 'Bruno',
  'Franco', 'Agustín', 'Nicolás', 'Lucas', 'Ignacio', 'Martina', 'Sofía', 'Camila', 'Valentina', 'Julieta',
  'Catalina', 'Delfina', 'Abril', 'Milagros', 'Lucía', 'Emilia', 'Paula', 'Juana', 'Renata', 'Bianca',
]
const APELLIDOS = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sosa', 'Romero', 'Álvarez',
  'Benítez', 'Acosta', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Giménez', 'Molina', 'Castro', 'Ríos',
  'Ferreyra', 'Ledesma', 'Vega', 'Ojeda', 'Paz', 'Cabrera', 'Ruiz', 'Navarro', 'Quiroga', 'Luna',
]
const RIVALES = [
  'Ferro Oeste', 'Atlético Palermo', 'Deportivo Norte', 'Náutico San Isidro', 'Sportivo Italiano', 'Racing del Sur',
  'Estudiantes BA', 'Club Social Lomas', 'Unión Vecinal', 'Defensores de Flores', 'Juventud Unida', 'Obras Sur',
]
const COLORES = ['#1f3fbf', '#f4f4f5', '#c1272d', '#111827', '#f59e0b', '#15803d']
const PROFES = [
  'Gustavo Pereyra', 'Laura Méndez', 'Diego Salvatierra', 'Carolina Ibarra', 'Marcelo Duarte', 'Florencia Arce',
]

function pick<T>(r: () => number, arr: readonly T[]) {
  return arr[Math.floor(r() * arr.length)]
}
function between(r: () => number, min: number, max: number) {
  return Math.round(min + r() * (max - min))
}
function isoDay(offset: number) {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const EDAD: Record<Categoria, [number, number]> = {
  'Sub-13': [11, 13],
  'Sub-15': [13, 15],
  'Sub-17': [15, 17],
  'Sub-19': [17, 19],
  Primera: [19, 33],
}

const cache = new Map<string, ClubData>()

export function getClubData(tenant: Tenant): ClubData {
  const hit = cache.get(tenant.slug)
  if (hit) return hit
  const r = seeded(tenant.slug)

  const coaches: Coach[] = PROFES.slice(0, 5).map((nombre, i) => {
    const deporte = tenant.sports[i % tenant.sports.length]
    const planificadas = between(r, 16, 24)
    const dictadas = Math.min(planificadas, planificadas - between(r, 0, 5))
    return {
      id: `c${i + 1}`,
      nombre,
      deporte,
      categorias: [CATEGORIAS[i % 5], CATEGORIAS[(i + 2) % 5]],
      planificadas,
      dictadas,
      cumplimiento: between(r, 68, 98),
      semana: [r() > 0.12, r() > 0.12, r() > 0.2, null, null],
      notas: [],
    }
  })

  const players: Player[] = Array.from({ length: 36 }, (_, i) => {
    const deporte = tenant.sports[i % tenant.sports.length]
    const categoria = CATEGORIAS[Math.floor(r() * 5)]
    const [a, b] = EDAD[categoria]
    const nombre = pick(r, NOMBRES)
    const apellido = pick(r, APELLIDOS)
    const eficacia = between(r, 42, 94)
    const base = between(r, 50, 90)
    const pool = coaches.filter((c) => c.deporte === deporte)
    const coach = pool.length ? pool[Math.floor(i / tenant.sports.length) % pool.length] : coaches[0]
    return {
      id: `p${i + 1}`,
      nombre,
      apellido,
      edad: between(r, a, b),
      deporte,
      categoria,
      puesto: pick(r, PUESTOS[deporte]),
      pase: r() > 0.82 ? pick(r, ['En trámite', 'A préstamo', 'Libre'] as Pase[]) : 'Habilitado',
      numero: between(r, 1, 30),
      alias: apellido.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      talle: pick(r, TALLES),
      eficacia,
      constancia: between(r, 45, 98),
      practica: between(r, 3, 12),
      fisico: between(r, 45, 95),
      tactica: between(r, 40, 95),
      asistencia: between(r, 60, 100),
      coachId: coach.id,
      evolucion: Array.from({ length: 8 }, (_, k) => Math.max(30, Math.min(99, base - 14 + k * 2 + between(r, -6, 6)))),
    }
  })

  coaches.forEach((c) => {
    const mine = players.filter((p) => p.coachId === c.id).slice(0, 3)
    c.notas = mine.map((p, k) => ({
      fecha: isoDay(-k * 3 - 1),
      playerId: p.id,
      tipo: (['Mejora', 'Seguimiento', 'Alerta'] as const)[k % 3],
      texto: [
        'Mejoró la lectura del juego en transición. Sostener trabajo de toma de decisiones.',
        'Trabajar perfil débil. Se asignó rutina extra de 20 minutos post entrenamiento.',
        'Faltó a dos prácticas seguidas. Hablar con la familia antes del viernes.',
      ][k % 3],
    }))
  })

  const prendas: Prenda[] = ['Camiseta', 'Short', 'Buzo', 'Campera', 'Medias']
  const orders: ApparelOrder[] = Array.from({ length: 14 }, (_, i) => {
    const p = players[between(r, 0, players.length - 1)]
    return {
      id: `o${i + 1}`,
      playerId: p.id,
      prenda: pick(r, prendas),
      talle: p.talle,
      numero: p.numero,
      alias: p.alias,
      estado: ESTADOS_PEDIDO[i % 4],
      fecha: isoDay(-between(r, 0, 20)),
    }
  })

  const materialBase: Omit<Material, 'id' | 'stock' | 'minimo'>[] = [
    { nombre: 'Pelotas de básquet N°7', tipo: 'Pelotas', deporte: 'Básquet', ubicacion: 'Depósito A' },
    { nombre: 'Pelotas de básquet N°6', tipo: 'Pelotas', deporte: 'Básquet', ubicacion: 'Depósito A' },
    { nombre: 'Pelotas de fútbol N°5', tipo: 'Pelotas', deporte: 'Fútbol', ubicacion: 'Depósito B' },
    { nombre: 'Pelotas de vóley', tipo: 'Pelotas', deporte: 'Vóley', ubicacion: 'Depósito A' },
    { nombre: 'Conos de señalización', tipo: 'Conos', deporte: 'General', ubicacion: 'Depósito B' },
    { nombre: 'Platos / conos chatos', tipo: 'Conos', deporte: 'General', ubicacion: 'Depósito B' },
    { nombre: 'Mancuernas 5 kg', tipo: 'Pesas', deporte: 'General', ubicacion: 'Gimnasio' },
    { nombre: 'Discos 10 kg', tipo: 'Pesas', deporte: 'General', ubicacion: 'Gimnasio' },
    { nombre: 'Colchonetas', tipo: 'Colchonetas', deporte: 'General', ubicacion: 'Gimnasio' },
    { nombre: 'Petos de entrenamiento', tipo: 'Entrenamiento', deporte: 'General', ubicacion: 'Utilería' },
    { nombre: 'Escaleras de coordinación', tipo: 'Entrenamiento', deporte: 'General', ubicacion: 'Utilería' },
    { nombre: 'Vallas de salto', tipo: 'Entrenamiento', deporte: 'General', ubicacion: 'Utilería' },
  ]
  const materials: Material[] = materialBase
    .filter((m) => m.deporte === 'General' || tenant.sports.includes(m.deporte as Sport))
    .map((m, i) => {
      const minimo = between(r, 6, 20)
      return { ...m, id: `m${i + 1}`, minimo, stock: between(r, Math.floor(minimo * 0.2), minimo * 2.4) }
    })

  const requests: MaterialRequest[] = materials.slice(0, 5).map((m, i) => ({
    id: `r${i + 1}`,
    materialId: m.id,
    cantidad: between(r, 4, 20),
    urgencia: (['Alta', 'Media', 'Baja'] as Urgencia[])[i % 3],
    solicitante: coaches[i % coaches.length].nombre,
    estado: (['Pendiente', 'Pendiente', 'Aprobada', 'Recibida', 'Aprobada'] as EstadoSolicitud[])[i],
    fecha: isoDay(-i * 2),
    motivo: ['Pelotas gastadas / pinchadas', 'Reposición de temporada', 'Rotura en entrenamiento', 'Nuevo grupo de categoría', 'Pérdida en partido visitante'][i],
  }))

  const lugares = ['Estadio Cubierto (sede)', 'Cancha auxiliar (sede)']
  const matches: Match[] = Array.from({ length: 14 }, (_, i) => {
    const offset = i - 5 + Math.floor(i / 3)
    const deporte = tenant.sports[i % tenant.sports.length]
    const local = r() > 0.45
    const rival = pick(r, RIVALES)
    const pf = deporte === 'Básquet' ? between(r, 58, 92) : deporte === 'Fútbol' ? between(r, 0, 4) : between(r, 0, 3)
    const pc = deporte === 'Básquet' ? between(r, 55, 90) : deporte === 'Fútbol' ? between(r, 0, 3) : between(r, 0, 3)
    return {
      id: `g${i + 1}`,
      deporte,
      categoria: CATEGORIAS[between(r, 0, 4)],
      torneo: deporte === 'Básquet' ? 'Liga Metropolitana' : deporte === 'Fútbol' ? 'Torneo Regional' : 'Copa Provincial',
      rival,
      condicion: local ? 'Local' : 'Visitante',
      fecha: isoDay(offset),
      hora: pick(r, ['10:00', '11:30', '15:00', '17:30', '19:00', '20:30', '21:00']),
      lugar: local ? pick(r, lugares) : `Sede ${rival}`,
      direccion: local ? tenant.city : `${pick(r, ['Av. Rivadavia', 'Av. San Martín', 'Calle Mitre', 'Av. Belgrano'])} ${between(r, 100, 4800)}`,
      camiseta: local ? COLORES[0] : COLORES[1],
      short: local ? COLORES[3] : COLORES[0],
      resultado: offset < 0 ? { pf, pc } : undefined,
    }
  })

  const standings: Standing[] = tenant.sports.map((deporte) => {
    const equipos = [tenant.name, ...RIVALES.slice(0, 7).map((x) => (r() > 0.5 ? x : x))]
    const rows = equipos.map((equipo, k) => {
      const pj = 12
      const pg = between(r, 2, 11)
      const pfBase = deporte === 'Básquet' ? 74 : 1.4
      const pf = Math.round(pj * pfBase * (0.85 + r() * 0.3))
      const pc = Math.round(pj * pfBase * (0.85 + r() * 0.3))
      return { equipo, pj, pg, pp: pj - pg, pf, pc, propio: k === 0 }
    })
    return {
      torneo: deporte === 'Básquet' ? 'Liga Metropolitana' : deporte === 'Fútbol' ? 'Torneo Regional' : 'Copa Provincial',
      deporte,
      categoria: 'Primera',
      rows,
    }
  })

  const objectives: Objective[] = tenant.sports.flatMap((deporte, k) => [
    { id: `ob${k}a`, titulo: 'Clasificar entre los 4 primeros', deporte, meta: 4, actual: 0, unidad: 'puesto' },
    {
      id: `ob${k}b`,
      titulo: deporte === 'Básquet' ? 'Promedio de puntos por partido' : 'Goles/Sets a favor en la temporada',
      deporte,
      meta: deporte === 'Básquet' ? 80 : 30,
      actual: deporte === 'Básquet' ? between(r, 68, 82) : between(r, 14, 28),
      unidad: deporte === 'Básquet' ? 'pts' : 'u.',
    },
    { id: `ob${k}c`, titulo: 'Asistencia promedio a entrenamientos', deporte, meta: 90, actual: between(r, 72, 92), unidad: '%' },
  ])

  const el = (nombre: string): CourtElement => {
    const x = r()
    return {
      id: `${nombre}-${Math.floor(r() * 1e6)}`,
      nombre,
      estado: x > 0.86 ? 'fuera' : x > 0.66 ? 'revisar' : 'ok',
      revisado: isoDay(-between(r, 0, 14)),
      nota: x > 0.66 ? pick(r, ['Desgaste visible', 'Tornillería floja', 'Reportado por profe', 'Pendiente repuesto']) : undefined,
    }
  }
  const courts: Court[] = [
    {
      id: 'k1',
      nombre: 'Estadio Cubierto',
      deporte: 'Básquet',
      superficie: 'Parquet',
      limpieza: { estado: 'Hecha', ultima: isoDay(0), responsable: 'Rubén (mantenimiento)' },
      elementos: ['Aro norte', 'Aro sur', 'Tablero norte', 'Tablero sur', 'Piso', 'Reloj / marcador', 'Reloj de posesión', 'Iluminación'].map(el),
    },
    {
      id: 'k2',
      nombre: 'Cancha Fútbol 11',
      deporte: 'Fútbol',
      superficie: 'Césped natural',
      limpieza: { estado: 'Pendiente', ultima: isoDay(-3), responsable: 'Cuadrilla externa' },
      elementos: ['Arco norte', 'Arco sur', 'Redes', 'Césped', 'Demarcación', 'Banco de suplentes', 'Iluminación'].map(el),
    },
    {
      id: 'k3',
      nombre: 'Gimnasio Auxiliar',
      deporte: 'Multiuso',
      superficie: 'Sintético',
      limpieza: { estado: 'Hecha', ultima: isoDay(-1), responsable: 'Rubén (mantenimiento)' },
      elementos: ['Postes de vóley', 'Red de vóley', 'Aros laterales', 'Piso', 'Reloj / marcador', 'Ventilación'].map(el),
    },
    {
      id: 'k4',
      nombre: 'Cancha Fútbol 5',
      deporte: 'Fútbol',
      superficie: 'Césped sintético',
      limpieza: { estado: 'Pendiente', ultima: isoDay(-2), responsable: 'Rubén (mantenimiento)' },
      elementos: ['Arcos', 'Redes perimetrales', 'Carpeta sintética', 'Iluminación'].map(el),
    },
  ]

  const incidents: Incident[] = courts.flatMap((c) =>
    c.elementos
      .filter((e) => e.estado !== 'ok')
      .slice(0, 2)
      .map((e, k) => ({
        id: `i-${c.id}-${k}`,
        courtId: c.id,
        elemento: e.nombre,
        descripcion: e.nota ?? 'Revisión solicitada',
        prioridad: e.estado === 'fuera' ? 'Alta' : 'Media',
        estado: k === 0 ? 'Abierto' : 'En curso',
        fecha: e.revisado,
      })),
  )

  const data = { players, orders, materials, requests, matches, standings, objectives, coaches, courts, incidents }
  cache.set(tenant.slug, data)
  return data
}

export function points(row: StandingRow) {
  return row.pg * 2 + row.pp
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', ...opts })
}

export function daysFromToday(iso: string) {
  const d = new Date(`${iso}T12:00:00-03:00`).getTime()
  return Math.round((d - TODAY.getTime()) / 86400000)
}
