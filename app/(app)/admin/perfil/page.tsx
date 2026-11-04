import type { Metadata } from 'next'
import { ProfilePage } from '@/components/profile/profile-page'
import { myClubs } from '@/lib/api/me'
import { requirePlatformAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Mi perfil — Sportiva' }

/** Mi perfil dentro de la administración: se mantiene la barra con Usuarios, Clubes y el resto. */
export default async function AdminProfilePage() {
  const session = await requirePlatformAdmin()
  const clubs = await myClubs()
  return <ProfilePage name={session.user.name} email={session.user.email} isPlatformAdmin clubs={clubs.ok ? clubs.data.data : []} />
}
