'use client'

import { useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  UserX,
  X,
} from 'lucide-react'
import {
  addToCategoryAction,
  deleteContactAction,
  deletePlayerAction,
  endMembershipAction,
  saveContactAction,
  updateShirtNumberAction,
  uploadPhotoAction,
} from '@/app/(app)/c/[club]/jugadores/actions'
import { ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { StatusBadge } from '@/components/club/eligibility/status'
import type { PlayerEligibility } from '@/lib/api/eligibility'
import type { Membership, Player, PlayerContact } from '@/lib/api/players'
import { formatDay } from '@/lib/format-date'
import { DOMINANT_SIDE, PLAYER_STATUS, RELATIONSHIP, photoUrl } from '@/lib/player-labels'
import { cn } from '@/lib/utils'
import { PlayerAvatar } from './player-avatar'
import { PlayerForm } from './player-form'

export type PlayerDetail = {
  player: Player
  history: Membership[]
  /** null: el usuario no ve los contactos. */
  contacts: PlayerContact[] | null
  /** null: el usuario no ve la habilitación. */
  eligibility: PlayerEligibility | null
}

type Flags = {
  update: boolean
  delete: boolean
  managePlayers: boolean
  contacts: boolean
  photo: boolean
}

type Mode =
  | { kind: 'view' }
  | { kind: 'edit' }
  | { kind: 'contact'; contact: PlayerContact | null }
  | { kind: 'category' }

/** Ficha del jugador en un panel lateral. Se abre con `?id=` en la URL. */
export function PlayerSheet({
  club,
  detail,
  notFound,
  categories,
  can,
}: {
  club: string
  detail: PlayerDetail | null
  notFound: boolean
  categories: { id: number; label: string; sport_id: number }[]
  can: Flags
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const open = Boolean(detail || notFound)
  const [mode, setMode] = useState<Mode>({ kind: 'view' })
  const [shownId, setShownId] = useState(detail?.player.id)
  // Otro jugador: vuelve a la vista de la ficha.
  if (detail?.player.id !== shownId) {
    setShownId(detail?.player.id)
    setMode({ kind: 'view' })
  }

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete('id')
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const back = () => setMode({ kind: 'view' })

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg [&_[data-slot=sheet-close]]:text-ink-foreground"
      >
        {!detail ? (
          <>
            <SheetHeader>
              <SheetTitle>No encontramos al jugador</SheetTitle>
              <SheetDescription>Puede que lo hayan dado de baja o que no sea de tus categorías.</SheetDescription>
            </SheetHeader>
          </>
        ) : mode.kind === 'view' ? (
          <PlayerView club={club} detail={detail} categories={categories} can={can} onMode={setMode} onDeleted={close} />
        ) : (
          <>
            <SheetHeader className="flex-row items-center gap-2 border-b">
              <Button variant="ghost" size="icon" className="size-8" onClick={back} aria-label="Volver a la ficha">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="flex flex-col">
                <SheetTitle>
                  {mode.kind === 'edit'
                    ? 'Editar ficha'
                    : mode.kind === 'category'
                      ? 'Sumar a una categoría'
                      : mode.contact
                        ? 'Editar contacto'
                        : 'Nuevo contacto'}
                </SheetTitle>
                <SheetDescription>
                  {detail.player.first_name} {detail.player.last_name}
                </SheetDescription>
              </div>
            </SheetHeader>
            <div className="flex flex-1 flex-col pt-4">
              {mode.kind === 'edit' && <PlayerForm player={detail.player} onDone={back} />}
              {mode.kind === 'contact' && <ContactForm playerId={detail.player.id} contact={mode.contact} onDone={back} />}
              {mode.kind === 'category' && (
                <CategoryForm
                  playerId={detail.player.id}
                  categories={categories}
                  current={detail.player.memberships ?? []}
                  onDone={back}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PlayerView({
  club,
  detail,
  categories,
  can,
  onMode,
  onDeleted,
}: {
  club: string
  detail: PlayerDetail
  categories: { id: number; sport_id: number }[]
  can: Flags
  onMode: (mode: Mode) => void
  onDeleted: () => void
}) {
  const { player, history, contacts, eligibility } = detail
  const status = PLAYER_STATUS[player.status] ?? { label: player.status, tone: 'neutral' as const }
  const current = player.memberships ?? []
  const ended = history.filter((m) => m.status !== 'active')
  const [removing, setRemoving] = useState(false)
  const [removingContact, setRemovingContact] = useState<PlayerContact | null>(null)
  const [endingMembership, setEndingMembership] = useState<Membership | null>(null)
  const number = current.find((m) => m.shirt_number != null)?.shirt_number

  return (
    <>
      <SheetHeader className="gap-4 bg-ink p-6 text-ink-foreground">
        <div className="flex items-center gap-4">
          <PhotoPicker club={club} player={player} canUpload={can.photo} />
          <div className="flex min-w-0 flex-col gap-1">
            <SheetTitle className="font-display text-2xl font-bold uppercase leading-tight text-ink-foreground">
              {player.first_name} {player.last_name}
            </SheetTitle>
            <SheetDescription className="text-ink-foreground/70">
              {[current.map((m) => m.category_name).join(', ') || 'Sin categoría', player.preferred_position, number != null ? `#${number}` : null]
                .filter(Boolean)
                .join(' · ')}
            </SheetDescription>
            <Pill tone={status.tone} className="w-fit bg-ink-foreground/10 text-ink-foreground">
              {status.label}
            </Pill>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Datos */}
        <Section
          title="Datos"
          action={
            can.update && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onMode({ kind: 'edit' })}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Editar
              </Button>
            )
          }
        >
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Datum label="Edad" value={player.age != null ? `${player.age} años` : '—'} />
            <Datum label="Nacimiento" value={formatDay(player.birth_date)} />
            <Datum label="DNI" value={player.document_number} />
            <Datum label="Ficha federativa" value={player.registration_number} />
            <Datum label="Puesto" value={player.preferred_position} />
            <Datum label="Perfil hábil" value={player.dominant_side ? DOMINANT_SIDE[player.dominant_side] : null} />
          </dl>
          {player.notes && <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm leading-relaxed">{player.notes}</p>}
        </Section>

        {/* Habilitación (FRO-34) */}
        {eligibility && current.length > 0 && (
          <Section
            title="Habilitación"
            action={
              <Link
                href={`/c/${club}/habilitacion?categoria=${current[0].category_id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver en el tablero
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            }
          >
            <p
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                eligibility.is_eligible ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive',
              )}
            >
              {eligibility.is_eligible ? <ShieldCheck className="size-4" aria-hidden="true" /> : <ShieldX className="size-4" aria-hidden="true" />}
              {eligibility.is_eligible
                ? 'Habilitado para jugar'
                : `No habilitado: le ${eligibility.missing === 1 ? 'falta 1 papel' : `faltan ${eligibility.missing} papeles`}`}
            </p>
            {eligibility.requirements.filter((r) => r.status !== 'not_applicable').length > 0 && (
              <ul className="flex flex-col divide-y rounded-lg border">
                {eligibility.requirements
                  .filter((r) => r.status !== 'not_applicable')
                  .map((r) => (
                    <li key={r.requirement_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.competition_name}
                          {r.expires_at && ` · vence ${formatDay(r.expires_at)}`}
                        </span>
                      </span>
                      {r.document_id && (
                        <a
                          href={`/c/${club}/documentos/${r.document_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Ver archivo
                        </a>
                      )}
                      <StatusBadge status={r.status} expiringSoon={r.expiring_soon} />
                    </li>
                  ))}
              </ul>
            )}
          </Section>
        )}

        {/* Contactos */}
        {contacts && (
          <Section
            title="Contactos de la familia"
            action={
              can.contacts && (
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onMode({ kind: 'contact', contact: null })}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Agregar
                </Button>
              )
            }
          >
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin contactos. Cargá al menos uno: es a quien le llega la convocatoria.
              </p>
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border">
                {contacts.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1.5 font-medium">
                        {c.name}
                        {c.is_primary && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
                            <Star className="size-3" aria-hidden="true" />
                            Principal
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {[RELATIONSHIP[c.relationship] ?? c.relationship, c.phone, c.email].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {c.phone && (
                        <>
                          <IconLink href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} label={`Llamar a ${c.name}`} icon={Phone} />
                          <IconLink
                            href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                            label={`WhatsApp a ${c.name}`}
                            icon={MessageCircle}
                            external
                          />
                        </>
                      )}
                      {c.email && <IconLink href={`mailto:${c.email}`} label={`Mail a ${c.name}`} icon={Mail} />}
                      {can.contacts && (
                        <>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => onMode({ kind: 'contact', contact: c })} aria-label={`Editar a ${c.name}`}>
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setRemovingContact(c)}
                            aria-label={`Eliminar a ${c.name}`}
                          >
                            <X className="size-3.5" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Categorías */}
        <Section
          title="Categorías"
          action={
            can.managePlayers &&
            categories.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onMode({ kind: 'category' })}>
                <Plus className="size-3.5" aria-hidden="true" />
                {current.length ? 'Sumar o pasar' : 'Sumar a una categoría'}
              </Button>
            )
          }
        >
          {current.length === 0 ? (
            <p className="text-sm text-muted-foreground">No juega en ninguna categoría.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {current.map((m) => (
                <MembershipRow key={m.id} membership={m} canManage={can.managePlayers} onEnd={() => setEndingMembership(m)} />
              ))}
            </ul>
          )}
          {ended.length > 0 && (
            <details className="group text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Historial ({ended.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {ended.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {m.category_name}
                      {m.shirt_number != null && ` · #${m.shirt_number}`}
                    </span>
                    <span className="tabular-nums">
                      {formatDay(m.start_date)} – {formatDay(m.end_date)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Section>

        {can.delete && (
          <Button
            variant="ghost"
            className="w-fit gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setRemoving(true)}
          >
            <UserX className="size-4" aria-hidden="true" />
            Dar de baja la ficha
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`¿Dar de baja a ${player.first_name} ${player.last_name}?`}
        description="Sale de sus categorías y deja de aparecer en el listado. Si solo dejó de venir, mejor cambiá su estado a Inactivo."
        confirmLabel="Dar de baja"
        onConfirm={async () => {
          const result = await deletePlayerAction(player.id)
          if (result.ok) onDeleted()
          return result
        }}
      />
      <ConfirmDialog
        open={removingContact !== null}
        onOpenChange={(o) => !o && setRemovingContact(null)}
        title={`¿Eliminar a ${removingContact?.name ?? 'este contacto'}?`}
        description="Deja de recibir los avisos del club sobre este jugador."
        confirmLabel="Eliminar"
        onConfirm={() => deleteContactAction(removingContact!.id)}
      />
      <ConfirmDialog
        open={endingMembership !== null}
        onOpenChange={(o) => !o && setEndingMembership(null)}
        title={`¿Quitarlo de ${endingMembership?.category_name ?? 'la categoría'}?`}
        description="Queda en su historial con la fecha de hoy. No se puede convocar para esa categoría."
        confirmLabel="Quitar"
        onConfirm={() => endMembershipAction(endingMembership!.id)}
      />
    </>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Datum({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('truncate text-sm font-semibold', !value && 'font-normal text-muted-foreground')}>{value || '—'}</dd>
    </div>
  )
}

function IconLink({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </a>
  )
}

/** Foto de la ficha: en el celular abre la cámara o la galería. */
function PhotoPicker({ club, player, canUpload }: { club: string; player: Player; canUpload: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const { pending, error, execute } = useConfigAction()
  const avatar = (
    <PlayerAvatar
      first={player.first_name}
      last={player.last_name}
      src={photoUrl(club, player.photo_document_id)}
      className="size-20 [&>span:first-child]:text-2xl"
    />
  )
  if (!canUpload) return avatar

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
        aria-label={player.photo_document_id ? 'Cambiar la foto' : 'Subir una foto'}
      >
        {avatar}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Camera className="size-5" aria-hidden="true" />}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const data = new FormData()
          data.append('file', file)
          execute(() => uploadPhotoAction(player.id, data))
          e.target.value = ''
        }}
      />
      {error && <p role="alert" className="max-w-24 text-center text-[11px] text-warning">{error}</p>}
    </div>
  )
}

function MembershipRow({
  membership,
  canManage,
  onEnd,
}: {
  membership: Membership
  canManage: boolean
  onEnd: () => void
}) {
  const [editing, setEditing] = useState(false)
  const { pending, fieldErrors, execute } = useConfigAction()

  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{membership.category_name}</span>
        <span className="text-xs text-muted-foreground">Desde {formatDay(membership.start_date)}</span>
      </div>
      {editing ? (
        <form
          className="flex items-start gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            execute(() => updateShirtNumberAction(membership.id, data), () => setEditing(false))
          }}
        >
          <Field
            id={`shirt-${membership.id}`}
            name="shirt_number"
            type="number"
            label="Número"
            className="w-20 [&_label]:sr-only"
            min={0}
            max={999}
            defaultValue={membership.shirt_number ?? ''}
            autoFocus
            error={fieldErrors.shirt_number}
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : 'Guardar'}
          </Button>
        </form>
      ) : (
        <>
          <span className="font-display text-xl font-bold tabular-nums">
            {membership.shirt_number != null ? `#${membership.shirt_number}` : <span className="text-sm font-normal text-muted-foreground">Sin número</span>}
          </span>
          {canManage && (
            <div className="flex">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(true)} aria-label={`Cambiar el número en ${membership.category_name}`}>
                <Pencil className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={onEnd}
                aria-label={`Quitar de ${membership.category_name}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </li>
  )
}

function ContactForm({ playerId, contact, onDone }: { playerId: number; contact: PlayerContact | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [relationship, setRelationship] = useState(contact?.relationship ?? 'mother')

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('relationship', relationship)
        execute(() => saveContactAction(playerId, contact?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="contact-name" name="name" label="Nombre y apellido" defaultValue={contact?.name} maxLength={150} required autoFocus error={fieldErrors.name} />
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="contact-relationship"
            label="Vínculo"
            value={relationship}
            onChange={setRelationship}
            options={Object.entries(RELATIONSHIP).map(([value, label]) => ({ value, label }))}
          />
          {fieldErrors.relationship && <p className="text-xs text-destructive">{fieldErrors.relationship}</p>}
        </div>
        <Field
          id="contact-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          label="Celular"
          placeholder="ej. 11 5555 0000"
          hint="Con este número se le manda la convocatoria por WhatsApp."
          defaultValue={contact?.phone ?? ''}
          maxLength={40}
          error={fieldErrors.phone}
        />
        <Field id="contact-email" name="email" type="email" label="Email" defaultValue={contact?.email ?? ''} maxLength={255} error={fieldErrors.email} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_primary" defaultChecked={contact?.is_primary ?? false} className="size-4 accent-primary" />
          Contacto principal (recibe los avisos del club)
        </label>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{contact ? 'Guardar cambios' : 'Agregar contacto'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function CategoryForm({
  playerId,
  categories,
  current,
  onDone,
}: {
  playerId: number
  categories: { id: number; label: string; sport_id: number }[]
  current: Membership[]
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const currentIds = new Set(current.map((m) => m.category_id))
  const options = categories.filter((c) => !currentIds.has(c.id))
  const [categoryId, setCategoryId] = useState(String(options[0]?.id ?? ''))
  const chosen = categories.find((c) => String(c.id) === categoryId)
  const sportOf = new Map(categories.map((c) => [c.id, c.sport_id]))
  // Ya juega en otra categoría de ese deporte: es un pase y la anterior se cierra.
  const previous = current.find((m) => chosen && sportOf.get(m.category_id) === chosen.sport_id)

  if (options.length === 0) {
    return <p className="mx-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Ya está en todas las categorías activas.</p>
  }

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('category_id', categoryId)
        if (previous) data.set('close_previous', 'on')
        execute(() => addToCategoryAction(playerId, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="membership-category"
            label="Categoría"
            value={categoryId}
            onChange={setCategoryId}
            options={options.map((c) => ({ value: String(c.id), label: c.label }))}
          />
          {fieldErrors.category_id && <p className="text-xs text-destructive">{fieldErrors.category_id}</p>}
        </div>
        <Field
          id="membership-number"
          name="shirt_number"
          type="number"
          inputMode="numeric"
          label="Número de camiseta"
          hint="Opcional. No se puede repetir dentro de la categoría."
          min={0}
          max={999}
          className="w-48"
          error={fieldErrors.shirt_number}
        />
        {previous && (
          <p className="rounded-lg bg-warning/15 px-3 py-2 text-xs leading-relaxed">
            <strong>Pase de categoría:</strong> hoy juega en {previous.category_name}, del mismo deporte. Al confirmar sale de{' '}
            {previous.category_name} y queda en su historial.
          </p>
        )}
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{previous ? 'Confirmar el pase' : 'Sumar a la categoría'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
