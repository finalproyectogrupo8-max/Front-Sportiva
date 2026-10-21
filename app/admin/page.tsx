import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminConsole } from '@/components/admin/admin-console'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { requirePlatformAdmin } from '@/lib/admin-guard'
import { listMemberships, listTenants, listUsers } from '@/lib/api/admin'

export default async function AdminPage() {
  await requirePlatformAdmin()
  const [users, tenants, memberships] = await Promise.all([
    listUsers(),
    listTenants(),
    listMemberships(),
  ])

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Logo />
        <Link
          href="/clubes"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 text-muted-foreground')}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a clubes
        </Link>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Administración central</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none text-balance">
            Plataforma Tribuna
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Gestioná usuarios, clubes y las asociaciones que habilitan el acceso a cada espacio.
          </p>
        </div>

        <AdminConsole users={users} tenants={tenants} memberships={memberships} />
      </section>
    </main>
  )
}
