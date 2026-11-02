import { cookies } from 'next/headers'
import { PLATFORM_COOKIE } from '@/lib/session-cookies'

// Descarga del CSV de suscriptores (FRO-27): el browser no llama a la API; esta ruta la pide con el
// token de plataforma de la cookie y devuelve el archivo tal cual.
export async function GET(): Promise<Response> {
  const token = (await cookies()).get(PLATFORM_COOKIE)?.value
  if (!token || !process.env.API_URL) return new Response('No autorizado', { status: 401 })

  const res = await fetch(`${process.env.API_URL}/admin/newsletter-subscribers?format=csv`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
    cache: 'no-store',
  })
  if (!res.ok || !res.body) return new Response('No se pudo descargar la lista.', { status: res.status === 403 ? 403 : 502 })

  return new Response(res.body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment; filename="suscriptores-newsletter.csv"',
    },
  })
}
