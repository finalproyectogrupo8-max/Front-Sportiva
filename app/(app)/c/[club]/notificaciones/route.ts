import { listNotifications } from '@/lib/api/home'

// La campanita (FRO-26) consulta cada 60 s. La API solo acepta el token del club, que el
// navegador no tiene: el front la pide y devuelve lo justo.
export async function GET() {
  try {
    const [recent, unread] = await Promise.all([
      listNotifications({ per_page: 15 }, 'return'),
      listNotifications({ unread: true, per_page: 1 }, 'return'),
    ])
    if (!recent.ok) return Response.json({ items: [], unread: 0 }, { status: recent.status })
    return Response.json(
      { items: recent.data.data, unread: unread.ok ? unread.data.meta.total : 0 },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch {
    return Response.json({ items: [], unread: 0 }, { status: 503 })
  }
}
