import type { Metadata } from 'next'
import { Logo } from '@/components/brand/logo'
import { ProfilePage } from '@/components/profile/profile-page'
import { ThemeToggle } from '@/components/theme-toggle'
import { myClubs } from '@/lib/api/me'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Mi perfil — Sportiva' }

/** Solo rutas internas: el link de "volver" no puede llevar a otro sitio. */
const safeBack = (value: string | undefined) => (value && /^\/(c\/[a-z0-9_]+|clubes|admin)(\/|$)/.test(value) ? value : null)

export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const query = await searchParams
  const session = await requireSession()
  const clubs = await myClubs()

  const back = safeBack(query.volver) ?? (session.tenant ? `/c/${session.tenant.slug}` : session.user.is_platform_admin ? '/admin' : '/clubes')
  const backLabel = back.startsWith('/c/') ? 'Volver al club' : back.startsWith('/admin') ? 'Volver a la administración' : 'Volver a mis clubes'

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-[120rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Logo />
        <ThemeToggle />
      </header>
      <ProfilePage name={session.user.name} email={session.user.email} clubs={clubs.ok ? clubs.data.data : []} backHref={back} backLabel={backLabel} />
    </main>
  )
}
