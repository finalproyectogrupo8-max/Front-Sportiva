'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type Place = { address: string; latitude: number | null; longitude: number | null }
type Suggestion = { label: string; detail: string; latitude: number; longitude: number }

/** Mapa embebido de Google por coordenadas o por dirección (sin API key). */
export function MapPreview({ place, className }: { place: Place; className?: string }) {
  const query = place.latitude != null && place.longitude != null ? `${place.latitude},${place.longitude}` : place.address
  if (!query.trim()) return null
  return (
    <iframe
      title={`Mapa: ${place.address}`}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn('h-48 w-full rounded-lg border bg-muted', className)}
    />
  )
}

/**
 * Buscador de direcciones: mientras se escribe sugiere lugares (OpenStreetMap). Al elegir uno
 * guarda la dirección y su punto, y muestra la preview del mapa para confirmar. También acepta
 * una dirección escrita a mano: el mapa la busca por texto.
 */
export function AddressPicker({
  club,
  label = 'Dirección',
  value,
  onChange,
  error,
  required,
  placeholder = 'Calle y número, ciudad',
}: {
  club: string
  label?: string
  value: Place
  onChange: (place: Place) => void
  error?: string
  required?: boolean
  placeholder?: string
}) {
  const id = useId()
  const [text, setText] = useState(value.address)
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [failed, setFailed] = useState(false)
  // Escribiendo a mano: el mapa espera a que se elija una sugerencia (no se recarga en cada tecla).
  const [touched, setTouched] = useState(false)
  // La búsqueda la dispara lo que escribe la persona, no la dirección que se eligió.
  const typed = useRef(false)

  useEffect(() => {
    if (!typed.current) return
    const q = text.trim()
    if (q.length < 4) return
    const controller = new AbortController()
    // Espera a que se deje de escribir: la política de OpenStreetMap pide no buscar en cada tecla.
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/c/${club}/geo?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const body = (await response.json()) as { data: Suggestion[] }
        setResults(body.data ?? [])
        setFailed(!response.ok)
        setOpen(true)
        setActive(-1)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 600)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text, club])

  const choose = (s: Suggestion) => {
    const address = [s.label, s.detail].filter(Boolean).join(', ')
    typed.current = false
    setTouched(false)
    setText(address)
    setOpen(false)
    onChange({ address, latitude: s.latitude, longitude: s.longitude })
  }

  const listId = `${id}-list`
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={id}
            value={text}
            required={required}
            autoComplete="off"
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              typed.current = true
              setTouched(true)
              setText(e.target.value)
              // Escrita a mano y sin elegir: sin punto, el mapa la busca por texto.
              onChange({ address: e.target.value, latitude: null, longitude: null })
              if (e.target.value.trim().length < 4) {
                setResults([])
                setOpen(false)
              }
            }}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => (i + 1) % results.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
              } else if (e.key === 'Enter' && active >= 0) {
                e.preventDefault()
                choose(results[active])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="pl-9 pr-8"
          />
          {loading && <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
        </div>
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {failed ? 'El buscador no responde. Podés escribir la dirección completa.' : 'Sin resultados. Probá con calle, número y ciudad.'}
              </li>
            ) : (
              results.map((s, i) => (
                <li
                  key={`${s.latitude},${s.longitude},${i}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(s)
                  }}
                  className={cn('flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm', i === active ? 'bg-muted' : 'hover:bg-muted')}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{s.label}</span>
                    {s.detail && <span className="truncate text-xs text-muted-foreground">{s.detail}</span>}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {value.latitude != null ? 'Ubicación elegida en el mapa.' : 'Escribí y elegí una de las sugerencias para marcar el punto exacto.'}
          </p>
        )}
      </div>
      {(value.latitude != null || !touched) && <MapPreview place={value} />}
    </div>
  )
}
