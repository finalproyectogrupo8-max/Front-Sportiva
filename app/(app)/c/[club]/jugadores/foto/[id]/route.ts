import { apiFetchFile } from '@/lib/api/client'

// Foto de la ficha del jugador. La API la sirve solo con el token del club (que el navegador no
// tiene), así que el front la pide y la reenvía. La API valida que el usuario vea a ese jugador.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 })

  const response = await apiFetchFile(`/documents/${id}/download`)
  if (!response || !response.ok || !response.body) {
    return new Response(null, { status: response?.status === 403 ? 403 : 404 })
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
      // Privada: depende del usuario. Un rato en el navegador evita pedirla en cada render.
      'Cache-Control': 'private, max-age=300',
    },
  })
}
