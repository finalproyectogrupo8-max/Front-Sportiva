import { apiFetchFile } from '@/lib/api/client'

// Documento de un jugador (apto médico, DNI, autorización). Como la foto, la API lo sirve solo
// con el token del club: el front lo pide y lo reenvía. La API valida el permiso y deja registro.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 })

  const response = await apiFetchFile(`/documents/${id}/download`)
  if (!response || !response.ok || !response.body) {
    return new Response(null, { status: response?.status === 403 ? 403 : 404 })
  }

  const headers = new Headers({
    'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
    'Cache-Control': 'private, no-store',
  })
  // Se abre en el navegador (PDF o imagen) con el nombre original.
  const disposition = response.headers.get('Content-Disposition')
  if (disposition) headers.set('Content-Disposition', disposition.replace(/^attachment/i, 'inline'))
  return new Response(response.body, { headers })
}
