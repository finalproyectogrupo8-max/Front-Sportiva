import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import { LoginForm } from '@/components/auth/login-form'
import { landingPath } from '@/lib/session'

export default async function LoginPage() {
  // Si ya hay sesión, no tiene sentido mostrar el login.
  const destination = await landingPath()
  if (destination) redirect(destination)

  return (
    <main className="grid min-h-dvh bg-zinc-950 text-white lg:grid-cols-[1.1fr_1fr]">
      {/* Sección lateral ilustrativa (desktop) */}
      <section className="relative hidden overflow-hidden bg-zinc-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src="/images/club-gym.png"
          alt="Gimnasio del club"
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" aria-hidden="true" />

        <div className="relative flex items-center gap-2">
          <Link href="/" className="transition hover:opacity-85">
            <Logo className="[&_span]:text-white" />
          </Link>
        </div>

        <div className="relative flex max-w-xl flex-col gap-6">
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] text-balance xl:text-7xl">
            Todo el club, en un solo lugar.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-zinc-300 text-pretty">
            Partidos, fichas, profes, utilería y canchas en un solo tablero operativo. Cada club con su propio espacio.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {['Básquet', 'Fútbol', 'Vóley', 'Multi-sede', 'Multi-club'].map((t) => (
              <li key={t} className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-zinc-300">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© 2026 Sportiva · Gestión operativa para clubes</p>
      </section>

      {/* Sección del formulario de login */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="lg:hidden w-fit mb-2">
              <Logo />
            </Link>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white">
              Iniciar sesión
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Accedé al panel de tu club con tu correo electrónico y contraseña.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  )
}
