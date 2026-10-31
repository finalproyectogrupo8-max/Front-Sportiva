'use client'

import { useState, useTransition } from 'react'
import { Check, ExternalLink, FileUp, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveAction,
  rejectAction,
  submitAction,
  type EligibilityResult,
} from '@/app/(app)/c/[club]/habilitacion/actions'
import { Field, FormError } from '@/components/club/forms'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { PlayerEligibility, RequirementStatus } from '@/lib/api/eligibility'
import { formatDay } from '@/lib/format-date'
import { StatusBadge } from './status'

type Props = {
  club: string
  open: boolean
  onOpenChange: (open: boolean) => void
  row: PlayerEligibility | null
  requirement: RequirementStatus | null
  can: { update: boolean; approve: boolean }
  /** Pinta el estado nuevo antes de que responda la API; devuelve cómo deshacerlo. */
  onOptimistic: (playerId: number, requirementId: number, status: string) => () => void
  onSaved: (row: PlayerEligibility) => void
}

type Action = 'submit' | 'approve' | 'reject'

/** Panel de un papel de un jugador: ver el archivo, presentarlo, aprobarlo o rechazarlo. */
export function RequirementPanel({ club, open, onOpenChange, row, requirement, can, onOptimistic, onSaved }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {row && requirement && (
          <PanelBody
            // Otro papel: el formulario arranca de cero. El estado no va en la key: el cambio optimista
            // no tiene que remontar el panel mientras guarda.
            key={`${row.player_id}-${requirement.requirement_id}`}
            club={club}
            row={row}
            requirement={requirement}
            can={can}
            onOptimistic={onOptimistic}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function PanelBody({
  club,
  row,
  requirement: r,
  can,
  onOptimistic,
  onSaved,
  onClose,
}: Omit<Props, 'open' | 'onOpenChange' | 'row' | 'requirement'> & {
  row: PlayerEligibility
  requirement: RequirementStatus
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [running, setRunning] = useState<Action | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [rejecting, setRejecting] = useState(false)
  // La API pide un vencimiento posterior a hoy.
  const [tomorrow] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10))

  const canSubmit = can.update && r.status !== 'approved'
  const canApprove = can.approve
  const canReject = can.approve && (r.status === 'submitted' || r.status === 'approved')
  const needsFile = r.requires_file && !r.document_id

  const run = (action: Action, form: HTMLFormElement | null, call: (data: FormData) => Promise<EligibilityResult>) => {
    const data = form ? new FormData(form) : new FormData()
    data.set('requirement_name', r.name)
    data.set('requires_file', r.requires_file ? '1' : '0')
    if (r.document_id) data.set('document_id', String(r.document_id))
    setError(undefined)
    setFieldErrors({})
    setRunning(action)

    // Aprobar y rechazar se ven al instante en la grilla; si la API falla, se vuelve atrás.
    const hasNewFile = data.get('file') instanceof File && (data.get('file') as File).size > 0
    const optimisticStatus = action === 'approve' && (!r.requires_file || r.document_id || hasNewFile) ? 'approved' : action === 'reject' ? 'rejected' : null
    const undo = optimisticStatus ? onOptimistic(row.player_id, r.requirement_id, optimisticStatus) : null

    startTransition(async () => {
      let result: EligibilityResult
      try {
        result = await call(data)
      } catch {
        result = { ok: false, error: 'No se pudo guardar. Probá de nuevo.' }
      }
      setRunning(null)
      if (result.ok) {
        onSaved(result.row)
        const now = result.row
        toast.success(result.message, {
          description: now.is_eligible ? `${now.player_name} quedó habilitado.` : undefined,
        })
        onClose()
        return
      }
      undo?.()
      setFieldErrors(result.fieldErrors ?? {})
      setError(result.error)
    })
  }

  return (
    <>
      <SheetHeader className="gap-3 border-b p-6">
        <div className="flex flex-col gap-1">
          <SheetDescription>{row.player_name}</SheetDescription>
          <SheetTitle className="text-xl">{r.name}</SheetTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} expiringSoon={r.expiring_soon} />
          <span className="text-xs text-muted-foreground">
            {r.competition_name}
            {!r.is_required && ' · opcional'}
          </span>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-6">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Vence</dt>
            <dd className="font-medium">{r.expires_at ? formatDay(r.expires_at) : r.status === 'approved' ? 'No vence' : '—'}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Archivo</dt>
            <dd>
              {r.document_id ? (
                <a
                  href={`/c/${club}/documentos/${r.document_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Ver archivo
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="text-muted-foreground">{r.requires_file ? 'Todavía no se subió' : 'No pide archivo'}</span>
              )}
            </dd>
          </div>
        </dl>

        {r.status === 'rejected' && r.rejection_reason && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <strong>Motivo del rechazo:</strong> {r.rejection_reason}
          </p>
        )}

        {!canSubmit && !canApprove && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Tu rol puede ver este papel, pero no cambiarlo.</p>
        )}

        {/* Presentar (profe y coordinador) */}
        {canSubmit && !rejecting && (
          <form
            className="flex flex-col gap-3 rounded-xl border p-4"
            onSubmit={(e) => {
              e.preventDefault()
              run('submit', e.currentTarget, (data) => submitAction(row.player_id, r.requirement_id, data))
            }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileUp className="size-4 text-primary" aria-hidden="true" />
              {r.status === 'submitted' ? 'Reemplazar lo presentado' : 'Presentar el papel'}
            </h3>
            <FileField id="submit-file" required={r.requires_file} error={fieldErrors.file} disabled={pending} />
            <Button type="submit" variant="outline" className="gap-2" disabled={pending}>
              {running === 'submit' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              Presentar
            </Button>
            {!canApprove && <p className="text-xs text-muted-foreground">Después lo aprueba el coordinador o el administrador.</p>}
          </form>
        )}

        {/* Aprobar (coordinador y admin) */}
        {canApprove && !rejecting && (
          <form
            className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success/5 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              run('approve', e.currentTarget, (data) => approveAction(row.player_id, r.requirement_id, data))
            }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Check className="size-4 text-success" aria-hidden="true" />
              {r.status === 'approved' ? 'Renovar' : 'Aprobar'}
            </h3>
            {(needsFile || !canSubmit) && (
              <FileField
                id="approve-file"
                required={needsFile}
                label={needsFile ? 'Archivo (lo pide este papel)' : 'Archivo nuevo (opcional)'}
                error={fieldErrors.file}
                disabled={pending}
              />
            )}
            <Field
              id="approve-expires"
              name="expires_at"
              type="date"
              label="Vence el"
              hint="Opcional. Si lo dejás vacío, se calcula con la validez del requisito (por ejemplo, 12 meses)."
              min={tomorrow}
              error={fieldErrors.expires_at}
              disabled={pending}
            />
            <Button type="submit" className="gap-2" disabled={pending}>
              {running === 'approve' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              {r.status === 'approved' ? 'Renovar' : 'Aprobar'}
            </Button>
          </form>
        )}

        {/* Rechazar */}
        {canReject &&
          (rejecting ? (
            <form
              className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
              onSubmit={(e) => {
                e.preventDefault()
                run('reject', e.currentTarget, (data) => rejectAction(row.player_id, r.requirement_id, data))
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reject-reason">¿Por qué se rechaza?</Label>
                <Textarea
                  id="reject-reason"
                  name="reason"
                  rows={3}
                  maxLength={255}
                  autoFocus
                  placeholder="ej. La foto no se lee, falta la firma del médico."
                  aria-invalid={fieldErrors.reason ? true : undefined}
                  disabled={pending}
                />
                {fieldErrors.reason && <p className="text-xs text-destructive">{fieldErrors.reason}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRejecting(false)} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" className="flex-1 gap-2" disabled={pending}>
                  {running === 'reject' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                  Rechazar
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" className="w-fit gap-1.5 text-destructive hover:text-destructive" onClick={() => setRejecting(true)}>
              <X className="size-4" aria-hidden="true" />
              Rechazar
            </Button>
          ))}

        <FormError message={error} />
      </div>
    </>
  )
}

function FileField({
  id,
  required,
  label,
  error,
  disabled,
}: {
  id: string
  required: boolean
  label?: string
  error?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label ?? (required ? 'Archivo' : 'Archivo (opcional)')}</Label>
      <input
        id={id}
        name="file"
        type="file"
        accept="application/pdf,image/*"
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          PDF o foto del celular, hasta 10 MB.
        </p>
      )}
    </div>
  )
}
