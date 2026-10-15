'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'tribuna_session'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const user = String(formData.get('usuario') ?? '').trim()
  const pass = String(formData.get('clave') ?? '')
  if (user !== 'admin' || pass !== 'admin') {
    return { error: 'Usuario o contraseña incorrectos. Probá con admin / admin.' }
  }
  const store = await cookies()
  store.set(COOKIE, 'admin', { httpOnly: true, sameSite: 'none', secure: true, path: '/', maxAge: 60 * 60 * 8 })
  redirect('/clubes')
}

export async function logout() {
  const store = await cookies()
  store.delete(COOKIE)
  redirect('/')
}

export async function requireSession() {
  const store = await cookies()
  if (store.get(COOKIE)?.value !== 'admin') redirect('/')
  return { usuario: 'admin', nombre: 'Administrador', rol: 'Coordinación general' }
}

export async function hasSession() {
  const store = await cookies()
  return store.get(COOKIE)?.value === 'admin'
}
