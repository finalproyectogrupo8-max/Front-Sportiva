import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ProfilePage } from '@/components/profile/profile-page'
import { ThemeToggle } from '@/components/theme-toggle'
import { myClubs } from '@/lib/api/me'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Mi perfil — Sportiva' }

/**
 * Mi perfil fuera de un club y de la administración (por ejemplo, desde el selector de clubes).
 * Si se llega con `volver` a un club o a la administración, se abre adentro de esa navegación.
 */
export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const query = await searchParams
  const session = await requireSession()
  const clubPath = query.volver?.match(/^\/c\/([a-z0-9_]+)(\/|$)/)
  if (clubPath && session.tenant?.slug === clubPath[1]) redirect(`/c/${clubPath[1]}/perfil`)
  if (query.volver?.startsWith('/admin') && session.user.is_platform_admin) redirect('/admin/perfil')

  const clubs = await myClubs()
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[120rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <Link href="/clubes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Mis clubes
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <ProfilePage name={session.user.name} email={session.user.email} isPlatformAdmin={!!session.user.is_platform_admin} clubs={clubs.ok ? clubs.data.data : []} />
    </main>
  )
}
