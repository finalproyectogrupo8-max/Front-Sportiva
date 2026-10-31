import type { Metadata } from 'next'
import { AttendancePage } from '@/components/club/matches/attendance-page'

export const metadata: Metadata = { title: 'Asistencia — Sportiva' }

export default async function MatchAttendancePage({ params }: { params: Promise<{ club: string; id: string }> }) {
  const { club, id } = await params
  return <AttendancePage club={club} kind="matches" id={Number(id)} />
}
