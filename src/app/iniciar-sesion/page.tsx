import type { Metadata } from 'next'
import Link from 'next/link'
import Brand from '@/components/Brand'
import { ArrowUpRight } from '@/components/icons'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-brand"><Brand /></div>
      <section className="login-card">
        <span className="route-eyebrow"><i />Acceso a clubes</span>
        <h1>VOLVÉ AL<br /><em>TABLERO.</em></h1>
        <form>
          <label><span>Email</span><input type="email" placeholder="vos@tuclub.com" /></label>
          <label><span>Contraseña</span><input type="password" placeholder="••••••••" /></label>
          <button type="button">Ingresar a Sportiva <ArrowUpRight /></button>
        </form>
        <p>¿Todavía no usás Sportiva? <Link href="/contacto">Solicitá una demo</Link></p>
      </section>
      <Link className="login-back" href="/">← Volver al inicio</Link>
    </main>
  )
}