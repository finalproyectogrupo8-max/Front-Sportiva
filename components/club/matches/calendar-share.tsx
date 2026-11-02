'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Check, Copy, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { calendarLinkAction, regenerateCalendarLinkAction, type CalendarShare } from '@/app/(app)/c/[club]/partidos/actions'
import { ConfigSheet, ConfirmDialog } from '@/components/club/forms'
import { FormSelect } from '@/components/club/shared'
import { Button, buttonVariants } from '@/components/ui/button'

type Category = { id: number; label: string }

/**
 * "Compartir calendario" (FRO-32): un link por categoría para agregar a Google Calendar o al
 * celular. Los partidos y entrenamientos aparecen solos y se actualizan.
 */
export function CalendarShareButton({ categories, initialCategoryId, canRegenerate }: { categories: Category[]; initialCategoryId?: number; canRegenerate: boolean }) {
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(String(initialCategoryId ?? categories[0]?.id ?? ''))
  const [link, setLink] = useState<CalendarShare | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [pending, startTransition] = useTransition()

  const load = (id: string) => {
    setCategoryId(id)
    setLink(null)
    if (!id) return
    startTransition(async () => setLink(await calendarLinkAction(Number(id))))
  }

  if (categories.length === 0) return null

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          setOpen(true)
          if (!link) load(categoryId)
        }}
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
        Compartir calendario
      </Button>

      <ConfigSheet open={open} onOpenChange={setOpen} title="Compartir calendario" description="Las familias lo agregan una vez y ven los partidos y entrenamientos de la categoría. Si algo cambia, se actualiza solo.">
        <div className="flex flex-col gap-5 px-4 pb-4">
          <FormSelect id="share-category" label="Categoría" value={categoryId} onChange={load} options={categories.map((c) => ({ value: String(c.id), label: c.label }))} />

          {pending || !link ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Armando el link…
            </p>
          ) : !link.ok ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {link.error}
            </p>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4">
                {/* SVG generado en el servidor con la librería qrcode: es contenido propio, no del usuario. */}
                <div className="size-48 [&_svg]:size-full" role="img" aria-label="Código QR del calendario" dangerouslySetInnerHTML={{ __html: link.qrSvg }} />
                <p className="text-center text-xs text-neutral-600">Escanealo con la cámara del celular para agregarlo.</p>
              </div>

              <div className="flex flex-col gap-2">
                <a href={link.google} target="_blank" rel="noreferrer" className={buttonVariants({ className: 'gap-2' })}>
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Agregar a Google Calendar
                </a>
                <a href={link.webcal} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
                  Agregar al calendario del celular (iPhone, Outlook)
                </a>
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={async () => {
                    await navigator.clipboard.writeText(link.webcal)
                    setCopied(true)
                    toast.success('Link copiado. Pegalo en el grupo de la categoría.')
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  Copiar link para el grupo
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Muestra solo fechas, horarios, rivales y lugares: ningún dato de los jugadores. Google Calendar actualiza los calendarios suscriptos cada algunas horas.
              </p>

              {canRegenerate && (
                <Button variant="ghost" size="sm" className="w-fit gap-2 text-muted-foreground" onClick={() => setRegenerating(true)}>
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Generar un link nuevo
                </Button>
              )}
            </>
          )}
        </div>
      </ConfigSheet>

      <ConfirmDialog
        open={regenerating}
        onOpenChange={setRegenerating}
        title="Generar un link nuevo"
        description="El link anterior deja de funcionar: quienes lo agregaron dejan de ver los partidos hasta que agreguen el nuevo. Sirve si el link llegó a quien no debía."
        confirmLabel="Generar link nuevo"
        onConfirm={async () => {
          const result = await regenerateCalendarLinkAction(Number(categoryId))
          if (!result.ok) return { ok: false, error: result.error }
          setLink(result)
          return { ok: true, message: 'Listo: compartí el link nuevo.' }
        }}
      />
    </>
  )
}
