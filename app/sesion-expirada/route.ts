import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'

// La API respondió 401 (token vencido o revocado, usuario desactivado). Los Server Components
// no pueden borrar cookies, así que lib/api/client.ts redirige acá: este handler las borra
// y manda al login.
export async function GET() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(PLATFORM_COOKIE)
  redirect('/')
}
