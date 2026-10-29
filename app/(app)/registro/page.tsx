'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import { Logo } from '@/components/brand/logo'

export default function RegistroPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      await axios.post('http://localhost:8000/api/register', {
        name,
        email,
        password,
        password_confirmation: password,
      })

      // Redirigir al login en caso de éxito
      router.push('/login?registrado=true')
    } catch (err: unknown) {
      console.error('Error al registrar usuario:', err)

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const data = err.response.data
          if (data?.errors) {
            setFieldErrors({
              name: data.errors.name?.[0],
              email: data.errors.email?.[0],
              password: data.errors.password?.[0],
            })
            setError(data.message || 'Por favor, revisá los campos del formulario.')
          } else {
            setError(data?.message || 'Error de validación al registrarse.')
          }
        } else if (err.response?.status === 409) {
          setFieldErrors({ email: 'Este correo electrónico ya está en uso.' })
          setError('El correo electrónico ingresado ya se encuentra registrado.')
        } else if (err.code === 'ERR_NETWORK') {
          setError(
            'No se pudo conectar con el servidor backend (http://localhost:8000). Asegurate de que el servicio esté corriendo.'
          )
        } else {
          setError(err.response?.data?.message || 'Ocurrió un error al crear la cuenta. Por favor, reintentá.')
        }
      } else {
        setError('Ocurrió un error inesperado al procesar la solicitud.')
      }
    } finally {
      setLoading(false)
    }
  }

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
        <div
          className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2">
          <Link href="/" className="transition hover:opacity-85">
            <Logo className="[&_span]:text-white" />
          </Link>
        </div>

        <div className="relative flex max-w-xl flex-col gap-6">
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] text-balance xl:text-7xl">
            Empezá a gestionar tu club.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-zinc-300 text-pretty">
            Creá tu cuenta de administrador para coordinar planteles, calendarios, fichas médicas y utilería en tiempo real.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {['Alta instantánea', 'Multi-rol', 'Acceso seguro', 'Sincronizado'].map((tag) => (
              <li key={tag} className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-zinc-300">
                {tag}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© 2026 Sportiva · Gestión operativa para clubes</p>
      </section>

      {/* Sección del formulario de registro */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-fit mb-2 lg:hidden">
              <Logo />
            </Link>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white">
              Crear cuenta
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Ingresá tus datos para dar de alta tu usuario en la plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400 animate-in fade-in duration-200"
              >
                <svg
                  className="size-5 shrink-0 text-red-400 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Campo Nombre */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className={`h-11 w-full rounded-lg border bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:outline-none focus:ring-1 ${
                  fieldErrors.name
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-800 focus:border-[#C8643C] focus:ring-[#C8643C]'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            {/* Campo Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@club.com"
                className={`h-11 w-full rounded-lg border bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:outline-none focus:ring-1 ${
                  fieldErrors.email
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-800 focus:border-[#C8643C] focus:ring-[#C8643C]'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={`h-11 w-full rounded-lg border bg-zinc-900 px-3.5 text-sm text-white placeholder-zinc-500 transition focus:outline-none focus:ring-1 ${
                  fieldErrors.password
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-800 focus:border-[#C8643C] focus:ring-[#C8643C]'
                }`}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C8643C] px-4 text-sm font-semibold text-white shadow-lg shadow-[#C8643C]/20 transition hover:bg-[#d97349] focus:outline-none focus:ring-2 focus:ring-[#C8643C] focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="size-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Crear mi cuenta</span>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            {/* Enlaces a login y home */}
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-zinc-400">
                ¿Ya tenés cuenta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[#C8643C] transition hover:text-[#d97349] hover:underline"
                >
                  Iniciá sesión
                </Link>
              </p>
              <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">
                ← Volver al inicio
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

