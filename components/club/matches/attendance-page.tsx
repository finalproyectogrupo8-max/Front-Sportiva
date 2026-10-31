import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { NoAccess } from '@/components/club/no-access'
import { getAttendance, getMatch, getTraining } from '@/lib/api/matches'
import { formatLongDay, formatTime } from '@/lib/club-time'
import { requireSession } from '@/lib/session'
import { AttendanceTaker } from './attendance-taker'

/** Página de asistencia de un partido o un entrenamiento (server component compartido). */
export async function AttendancePage({ club, kind, id }: { club: string; kind: 'matches' | 'trainings'; id: number }) {
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('attendance.view') && !permissions.has('attendance.record')) {
    return <NoAccess moduleName="Asistencia" homeHref={`/c/${club}`} />
  }
  if (!id) notFound()

  const [event, roster] = await Promise.all([kind === 'matches' ? getMatch(id) : getTraining(id), getAttendance(kind, id)])
  if (!event.ok || !roster.ok) notFound()

  const data = event.data.data
  const isMatch = kind === 'matches'
  const startsAt = 'match_date' in data ? data.match_date : data.starts_at
  const title = 'opponent' in data ? `${data.is_home ? 'vs' : 'en'} ${data.opponent}` : 'Entrenamiento'
  const back = isMatch ? `/c/${club}/partidos/${id}` : `/c/${club}/partidos?entrenamiento=${id}`

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-10">
      <Link href={back} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {isMatch ? 'Volver al partido' : 'Volver al calendario'}
      </Link>
      <header className="flex flex-col gap-1 rounded-2xl bg-ink p-6 text-ink-foreground">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-foreground/70">Asistencia · {data.category_name}</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-none">{title}</h1>
        <p className="text-sm text-ink-foreground/80 first-letter:uppercase">
          {formatLongDay(startsAt)} · {formatTime(startsAt)} h
        </p>
      </header>
      <AttendanceTaker kind={kind} eventId={id} rows={roster.data.data} canRecord={permissions.has('attendance.record')} columns={2} />
    </div>
  )
}
