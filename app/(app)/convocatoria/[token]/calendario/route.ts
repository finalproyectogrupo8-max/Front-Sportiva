import { apiFetchFile } from '@/lib/api/client'

/** "Agregar al calendario": reenvía el .ics de la API. Sirve el token del grupo o el personal. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const response = await apiFetchFile(`/public/callups/${encodeURIComponent(token)}/calendar.ics`, { auth: 'none' })
  if (!response || !response.ok) return new Response('Link no válido o vencido.', { status: response?.status === 404 ? 404 : 502 })

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="partido.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
