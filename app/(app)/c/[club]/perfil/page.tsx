import type { Metadata } from 'next'
import { ProfilePage } from '@/components/profile/profile-page'
import { myClubs } from '@/lib/api/me'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Mi perfil — Sportiva' }

/** Mi perfil dentro del club: se mantiene la barra del club con sus módulos. */
export default async function ClubProfilePage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  const session = await requireSession()
  const clubs = await myClubs()
  return <ProfilePage name={session.user.name} email={session.user.email} isPlatformAdmin={!!session.user.is_platform_admin} clubs={clubs.ok ? clubs.data.data : []} currentClub={club} />
}
