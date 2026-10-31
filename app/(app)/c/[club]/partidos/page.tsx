import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'
import { CalendarToolbar } from '@/components/club/matches/calendar-toolbar'
import { CalendarView } from '@/components/club/matches/calendar-view'
import { NewEventButtons } from '@/components/club/matches/new-event-buttons'
import { TrainingSheet } from '@/components/club/matches/training-sheet'
import { NoAccess } from '@/components/club/no-access'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { listCategories, listCompetitions, listVenues } from '@/lib/api/club'
import { calendar, getTraining } from '@/lib/api/matches'
import { addDays, addMonths, isValidDay, startOfMonth, startOfWeek, today } from '@/lib/club-time'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Partidos — Sportiva' }

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<{ vista?: string; desde?: string; categoria?: string; entrenamiento?: string }>
}

/** Rango que muestra el calendario: la semana (lunes a domingo) o el mes completo en semanas. */
function range(view: 'semana' | 'mes', anchor: string) {
  if (view === 'semana') {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 6) }
  }
  const first = startOfMonth(anchor)
  const from = startOfWeek(first)
  const last = addDays(addMonths(first, 1), -1)
  const to = addDays(startOfWeek(last), 6)
  return { from, to }
}

export default async function MatchesPage({ params, searchParams }: Props) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  if (!can('matches.view') && !can('trainings.view')) return <NoAccess moduleName="Partidos" homeHref={`/c/${club}`} />

  const view = query.vista === 'mes' ? 'mes' : 'semana'
  const anchor = isValidDay(query.desde) ? query.desde : today()
  const { from, to } = range(view, anchor)
  const categoryId = Number(query.categoria) || undefined
  const trainingId = Number(query.entrenamiento) || null

  let events, categories, competitions, training, venues
  try {
    ;[events, categories, competitions, training, venues] = await Promise.all([
      calendar({ from, to, category_id: categoryId }),
      listCategories(),
      can('competitions.view') ? listCompetitions() : Promise.resolve(null),
      trainingId ? getTraining(trainingId) : Promise.resolve(null),
      can('venues.view') ? listVenues({ is_active: true }) : Promise.resolve(null),
    ])
  } catch {
    events = null
  }

  const categoryOptions = categories?.ok
    ? categories.data.data.filter((c) => c.is_active).map((c) => ({ id: c.id, label: c.name, season_id: c.season_id }))
    : []
  const competitionOptions = competitions?.ok
    ? competitions.data.data.map((c) => ({ id: c.id, label: c.name, category_ids: (c.categories ?? []).map((x) => x.id) }))
    : []

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Partidos"
        description="El fixture y los entrenamientos de cada categoría. Desde cada partido se carga el resultado y se toma asistencia."
        actions={
          <NewEventButtons
            club={club}
            venues={venues?.ok ? venues.data.data : []}
            categories={categoryOptions}
            competitions={competitionOptions}
            can={{ match: can('matches.create'), training: can('trainings.create') }}
          />
        }
      >
        <CalendarToolbar view={view} from={from} to={to} anchor={anchor} categories={categoryOptions} />
      </ModuleHeader>

      <PageBody>
        {!events || !events.ok ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-8" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">No se pudo cargar el calendario</h2>
              <p className="text-xs text-muted-foreground">{events?.message ?? 'Asegurate de que la API esté corriendo y probá recargar.'}</p>
            </div>
          </div>
        ) : (
          <CalendarView club={club} view={view} from={from} to={to} anchor={anchor} events={events.data.data} />
        )}
      </PageBody>

      <TrainingSheet
        club={club}
        training={training?.ok ? training.data.data : null}
        notFound={Boolean(trainingId && !training?.ok)}
        categories={categoryOptions}
        can={{ update: can('trainings.update'), delete: can('trainings.delete'), attendance: can('attendance.record') || can('attendance.view') }}
      />
    </>
  )
}
