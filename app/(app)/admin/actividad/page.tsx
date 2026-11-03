import { redirect } from 'next/navigation'
import { AlertTriangle, ScrollText } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/session'
import {
  listPlatformActivity,
  type PlatformActivitySubjectType,
} from '@/lib/api/activity'
import { ActivityFilters } from '@/components/admin/activity-filters'
import { ActivityTable } from '@/components/admin/activity-table'
import { Pagination } from '@/components/admin/pagination'
import { isValidDay } from '@/lib/club-time'

const SUBJECT_TYPES: PlatformActivitySubjectType[] = [
  'tenant',
  'user',
  'membership',
  'document',
  'auth',
]

function parseSubjectType(value: string | undefined): PlatformActivitySubjectType | undefined {
  return SUBJECT_TYPES.find((type) => type === value)
}

export default async function AdminActividadPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject_type?: string
    actor_id?: string
    from?: string
    to?: string
    page?: string
    per_page?: string
  }>
}) {
  // Guard de acceso: si no es admin de plataforma, redirige a /clubes.
  await requirePlatformAdmin()

  const params = await searchParams

  const subjectType = parseSubjectType(params.subject_type)
  const parsedActorId = params.actor_id ? parseInt(params.actor_id, 10) : NaN
  const actorId = Number.isFinite(parsedActorId) && parsedActorId > 0 ? parsedActorId : undefined
  const from = isValidDay(params.from) ? params.from : undefined
  const to = isValidDay(params.to) ? params.to : undefined
  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1
  const perPage = params.per_page
    ? Math.min(100, Math.max(1, parseInt(params.per_page, 10) || 30))
    : 30

  let result
  let connectionError = false

  try {
    result = await listPlatformActivity({
      subject_type: subjectType,
      actor_id: actorId,
      from,
      to,
      page,
      per_page: perPage,
    })
  } catch {
    connectionError = true
  }

  // Si la API responde 403 Forbidden, redirigimos a /clubes para usuarios no autorizados.
  if (result && !result.ok && result.status === 403) {
    redirect('/clubes')
  }

  const filtered = Boolean(subjectType || actorId || from || to)

  return (
    <div className="mx-auto flex max-w-[120rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      {/* Header de la sección, igual que Clubes y Usuarios */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administración central
        </p>
        <div className="flex items-center gap-2">
          <ScrollText className="size-7 text-foreground" aria-hidden="true" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            Actividad
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Qué se creó, cambió o dio de baja en la plataforma, quién lo hizo y cuándo.
        </p>
      </div>

      <section className="flex flex-col gap-4" aria-label="Registro de actividad de la plataforma">
        <ActivityFilters />

        {connectionError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-8" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">Error de conexión con la API</h2>
              <p className="text-xs text-muted-foreground">
                No pudimos consultar la actividad. Asegurate de que la API esté corriendo y probá recargar.
              </p>
            </div>
          </div>
        ) : !result || !result.ok ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-8" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">No se pudo cargar la actividad</h2>
              <p className="text-xs text-muted-foreground">
                {result && 'message' in result ? result.message : 'Error inesperado del servidor.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ActivityTable events={result.data.data} filtered={filtered} />
            <Pagination meta={result.data.meta} label={{ one: 'evento', many: 'eventos' }} />
          </>
        )}
      </section>
    </div>
  )
}
