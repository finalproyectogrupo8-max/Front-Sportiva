import { ClubHome } from '@/components/club/home/club-home'
import { requireSession } from '@/lib/session'

export default async function ClubHomePage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  const session = await requireSession()
  return <ClubHome club={club} userName={session.user.name} permissions={session.permissions ?? []} />
}
