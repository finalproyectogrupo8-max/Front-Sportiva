import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/session-cookies'

// Buscador de direcciones (FRO-39) con OpenStreetMap (Nominatim). Pasa por el front para
// mandar un User-Agent propio, cachear y no exponer el servicio a cualquiera: solo con sesión.
// Política de uso: https://operations.osmfoundation.org/policies/nominatim/ (bajo volumen,
// sin autocompletar agresivo: el componente espera a que se deje de escribir).

type NominatimPlace = {
  lat: string
  lon: string
  display_name: string
  name?: string
  address?: Record<string, string>
}

export type GeoResult = { label: string; detail: string; latitude: number; longitude: number }

/** "Club Atlético Banfield, Peña 1501, Banfield, Lomas de Zamora…" → título y detalle cortos. */
function describe(place: NominatimPlace): { label: string; detail: string } {
  const a = place.address ?? {}
  const street = [a.road, a.house_number].filter(Boolean).join(' ')
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.city_district ?? a.municipality ?? ''
  const state = a.state ?? ''
  const label = place.name && place.name !== street ? place.name : street || place.display_name.split(',')[0]
  const detail = [place.name && street && place.name !== street ? street : null, city, state].filter(Boolean).join(', ')
  return { label, detail }
}

export async function GET(request: Request) {
  if (!(await cookies()).has(SESSION_COOKIE)) return Response.json({ data: [] }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 4 || q.length > 200) return Response.json({ data: [] })

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'ar',
    'accept-language': 'es',
  }).toString()

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Sportiva/1.0 (gestion de clubes deportivos)', Accept: 'application/json' },
      // La misma búsqueda no cambia en un día.
      next: { revalidate: 86400 },
    })
    if (!response.ok) return Response.json({ data: [], error: 'unavailable' }, { status: 502 })
    const places = (await response.json()) as NominatimPlace[]
    const data: GeoResult[] = places.map((p) => ({ ...describe(p), latitude: Number(p.lat), longitude: Number(p.lon) }))
    return Response.json({ data })
  } catch {
    return Response.json({ data: [], error: 'unavailable' }, { status: 502 })
  }
}
