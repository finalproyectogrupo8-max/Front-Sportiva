import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import { LoginForm } from '@/components/auth/login-form'
import { hasSession } from '@/lib/auth'

export default async function LoginPage() {
  if (await hasSession()) redirect('/clubes')

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src="/images/club-gym.png"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" aria-hidden="true" />
        <div className="relative flex items-center gap-2">
          <Logo className="[&_span]:text-ink-foreground" />
        </div>
        <div className="relative flex max-w-xl flex-col gap-6">
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] text-balance xl:text-7xl">
            Todo el club, visto desde la tribuna.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-ink-foreground/75 text-pretty">
            Partidos, fichas, profes, utilería y canchas en un solo tablero operativo. Cada club con su propio espacio.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {['Básquet', 'Fútbol', 'Vóley', 'Multi-sede', 'Multi-club'].map((t) => (
              <li key={t} className="rounded-full border border-ink-foreground/20 px-3 py-1 text-ink-foreground/85">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-ink-foreground/50">{'© 2026 Tribuna · Gestión operativa para clubes'}</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Logo className="lg:hidden" />
            <h2 className="font-display text-4xl font-bold uppercase leading-none">Ingresar</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Accedé al panel de tu club. Para la demo usá <span className="font-medium text-foreground">admin</span> /{' '}
              <span className="font-medium text-foreground">admin</span>.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
