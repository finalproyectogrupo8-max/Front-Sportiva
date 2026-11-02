'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Mail, Megaphone, Plus, Search, Send, Trash2, X } from 'lucide-react'
import {
  deleteAnnouncementAction,
  previewAudienceAction,
  saveDraftAction,
  searchPlayersAction,
  sendAnnouncementAction,
} from '@/app/(app)/c/[club]/comunicados/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, Field, FormError, useConfigAction } from '@/components/club/forms'
import { Meter, ModuleHeader, PageBody, Pill, Segmented, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownLite } from '@/lib/markdown-lite'
import { CLUB_TZ, formatTime } from '@/lib/club-time'
import { cn } from '@/lib/utils'

type Audience = {
  categories?: { category_id: number; players?: boolean; tutors?: boolean; coaches?: boolean }[]
  players?: { player_ids: number[]; players?: boolean; tutors?: boolean }
  role_slugs?: string[]
  club_user_ids?: number[]
}
type Announcement = {
  id: number
  subject: string
  body: string
  audience: Audience
  status: string
  sent_at: string | null
  recipients_count: number
  sent_count: number
  failed_count: number
  created_at: string
}
type Recipient = { id: number; email: string; name: string; status: string; error: string | null }
type Named = { id: number; name: string }
type Groups = { players: boolean; tutors: boolean; coaches: boolean }

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  sending: { label: 'Enviando', tone: 'info' },
  sent: { label: 'Enviado', tone: 'ok' },
}
const RECIPIENT: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'En cola', tone: 'info' },
  sent: { label: 'Entregado', tone: 'ok' },
  failed: { label: 'Falló', tone: 'bad' },
}
const dateTime = (iso: string) => `${new Date(iso).toLocaleDateString('es-AR', { timeZone: CLUB_TZ, day: 'numeric', month: 'short' })}, ${formatTime(iso)} h`

export function AnnouncementsModule({
  clubName,
  announcements,
  categories,
  roles,
  users,
  open,
  compose,
  can,
}: {
  clubName: string
  announcements: Announcement[]
  categories: Named[]
  roles: { slug: string; name: string }[]
  users: Named[]
  open: { announcement: Announcement; recipients: Recipient[] } | null
  compose: { categoryId: number | null; subject: string; body: string } | null
  can: { send: boolean; staff: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [editing, setEditing] = useState<Announcement | 'new' | null>(compose ? 'new' : null)
  const sending = announcements.some((a) => a.status === 'sending')

  // Mientras haya envíos en curso, se refresca para ver los contadores.
  useEffect(() => {
    if (!sending) return
    const timer = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(timer)
  }, [sending, router])

  const closeComposer = () => {
    setEditing(null)
    if (compose) router.replace(pathname, { scroll: false })
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Comunicados"
        description="Mails del club a jugadores, tutores, profes y staff. Cada dirección recibe uno solo, aunque esté en varios grupos."
      >
        {can.send && (
          <Button className="gap-2" onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo comunicado
          </Button>
        )}
      </ModuleHeader>

      <PageBody>
        {announcements.length === 0 ? (
          <EmptyConfig
            icon={Megaphone}
            title="Todavía no hay comunicados"
            description="Por ejemplo: «Se suspende el entrenamiento de Sub-15» o «Retirar la indumentaria el sábado»."
            action={can.send ? <Button onClick={() => setEditing('new')}>Escribir el primero</Button> : undefined}
          />
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Historial de comunicados">
            {announcements.map((a) => {
              const status = STATUS[a.status] ?? STATUS.draft
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => (a.status === 'draft' && can.send ? setEditing(a) : router.replace(`${pathname}?comunicado=${a.id}`, { scroll: false }))}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary/50"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{a.subject}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.sent_at ? `Enviado el ${dateTime(a.sent_at)}` : `Creado el ${dateTime(a.created_at)}`}
                        {a.status !== 'draft' && ` · ${a.recipients_count} destinatarios · ${a.sent_count} entregados`}
                        {a.failed_count > 0 && ` · ${a.failed_count} fallidos`}
                      </span>
                    </div>
                    <span className="flex items-center gap-2">
                      {a.failed_count > 0 && <Pill tone="bad">{a.failed_count} fallidos</Pill>}
                      <Pill tone={status.tone}>
                        {a.status === 'sending' && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                        {status.label}
                      </Pill>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PageBody>

      {open && <Detail key={open.announcement.id} {...open} clubName={clubName} onClose={() => router.replace(pathname, { scroll: false })} />}
      {editing !== null && (
        <Composer
          key={editing === 'new' ? 'new' : editing.id}
          draft={editing === 'new' ? null : editing}
          initial={editing === 'new' ? compose : null}
          clubName={clubName}
          categories={categories}
          roles={roles}
          users={users}
          canWriteStaff={can.staff}
          onClose={closeComposer}
        />
      )}
    </>
  )
}

function Detail({ announcement, recipients, clubName, onClose }: { announcement: Announcement; recipients: Recipient[]; clubName: string; onClose: () => void }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'failed'>('all')
  const status = STATUS[announcement.status] ?? STATUS.draft
  const done = announcement.sent_count + announcement.failed_count

  useEffect(() => {
    if (announcement.status !== 'sending') return
    const timer = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(timer)
  }, [announcement.status, router])

  const shown = filter === 'failed' ? recipients.filter((r) => r.status === 'failed') : recipients

  return (
    <ConfigSheet open onOpenChange={(o) => !o && onClose()} title={announcement.subject} description={announcement.sent_at ? `Enviado el ${dateTime(announcement.sent_at)}` : undefined} wide>
      <div className="flex flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <Pill tone={status.tone}>{status.label}</Pill>
            <span className="tabular-nums text-muted-foreground">
              {announcement.sent_count} entregados · {announcement.failed_count} fallidos · {announcement.recipients_count} en total
            </span>
          </div>
          <Meter value={done} max={Math.max(announcement.recipients_count, 1)} tone={announcement.failed_count ? 'warn' : 'ok'} />
        </div>

        <EmailPreview clubName={clubName} subject={announcement.subject} body={announcement.body} />

        <section aria-labelledby="destinatarios" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 id="destinatarios" className="text-sm font-semibold">
              Destinatarios
            </h3>
            {announcement.failed_count > 0 && (
              <Segmented
                label="Filtrar"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'failed', label: 'Fallidos', count: announcement.failed_count },
                ]}
              />
            )}
          </div>
          <ul className="divide-y rounded-lg border">
            {shown.map((r) => {
              const s = RECIPIENT[r.status] ?? RECIPIENT.pending
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{r.email}</span>
                    {r.error && <span className="text-xs text-destructive">{r.error}</span>}
                  </div>
                  <Pill tone={s.tone}>{s.label}</Pill>
                </li>
              )
            })}
          </ul>
          {recipients.length >= 100 && <p className="text-xs text-muted-foreground">Se muestran los primeros 100.</p>}
        </section>
      </div>
    </ConfigSheet>
  )
}

function EmailPreview({ clubName, subject, body }: { clubName: string; subject: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-col gap-0.5 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span>
          Asunto: <span className="font-medium text-foreground">[{clubName}] {subject || 'Sin asunto'}</span>
        </span>
      </div>
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-base font-semibold">{subject || 'Sin asunto'}</p>
        <p className="text-sm">Hola, Nombre:</p>
        {body.trim() ? <MarkdownLite text={body} /> : <p className="text-sm text-muted-foreground">El mensaje aparece acá.</p>}
        <p className="text-sm">{clubName}</p>
      </div>
    </div>
  )
}

const NONE: Groups = { players: false, tutors: false, coaches: false }

function Composer({
  draft,
  initial,
  clubName,
  categories,
  roles,
  users,
  canWriteStaff,
  onClose,
}: {
  draft: Announcement | null
  initial: { categoryId: number | null; subject: string; body: string } | null
  clubName: string
  categories: Named[]
  roles: { slug: string; name: string }[]
  users: Named[]
  canWriteStaff: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [id, setId] = useState<number | null>(draft?.id ?? null)
  const [subject, setSubject] = useState(draft?.subject ?? initial?.subject ?? '')
  const [body, setBody] = useState(draft?.body ?? initial?.body ?? '')
  const [tab, setTab] = useState<'escribir' | 'vista'>('escribir')
  const [groups, setGroups] = useState<Record<number, Groups>>(() => {
    const fromDraft = Object.fromEntries((draft?.audience.categories ?? []).map((c) => [c.category_id, { players: !!c.players, tutors: !!c.tutors, coaches: !!c.coaches }]))
    if (initial?.categoryId) fromDraft[initial.categoryId] = { players: true, tutors: true, coaches: false }
    return fromDraft
  })
  const [players, setPlayers] = useState<Named[]>(() => (draft?.audience.players?.player_ids ?? []).map((pid) => ({ id: pid, name: `Jugador #${pid}` })))
  const [playerGroups, setPlayerGroups] = useState({ players: draft?.audience.players?.players ?? true, tutors: draft?.audience.players?.tutors ?? true })
  const [roleSlugs, setRoleSlugs] = useState<string[]>(draft?.audience.role_slugs ?? [])
  const [userIds, setUserIds] = useState<number[]>(draft?.audience.club_user_ids ?? [])
  const [preview, setPreview] = useState<{ count: number; without: number; names: string[] } | { error: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const { pending, error, fieldErrors, execute } = useConfigAction()

  const audience = useMemo<Audience>(() => {
    const cats = Object.entries(groups)
      .filter(([, g]) => g.players || g.tutors || g.coaches)
      .map(([categoryId, g]) => ({ category_id: Number(categoryId), ...g }))
    return {
      ...(cats.length ? { categories: cats } : {}),
      ...(players.length ? { players: { player_ids: players.map((p) => p.id), ...playerGroups } } : {}),
      ...(roleSlugs.length ? { role_slugs: roleSlugs } : {}),
      ...(userIds.length ? { club_user_ids: userIds } : {}),
    }
  }, [groups, players, playerGroups, roleSlugs, userIds])
  const hasTarget = Object.keys(audience).length > 0

  // Cuenta las direcciones cada vez que cambian los destinatarios (con un respiro para no llamar en cada clic).
  useEffect(() => {
    if (!hasTarget) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await previewAudienceAction(audience)
      if (cancelled) return
      setPreview(result.ok ? { count: result.data.recipients_count, without: result.data.without_email_count, names: result.data.without_email } : { error: result.error })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [audience, hasTarget])

  const toggle = (categoryId: number, key: keyof Groups) =>
    setGroups((all) => ({ ...all, [categoryId]: { ...(all[categoryId] ?? NONE), [key]: !(all[categoryId] ?? NONE)[key] } }))
  const input = { subject: subject.trim(), body: body.trim(), audience }
  const count = preview && 'count' in preview && hasTarget ? preview.count : null

  const saveDraft = (then?: (draftId: number) => void) =>
    execute(
      () => saveDraftAction(id, input),
      (result) => {
        if (result.id) setId(result.id)
        if (then && result.id) then(result.id)
        else onClose()
      },
    )

  return (
    <>
      <ConfigSheet open onOpenChange={(o) => !o && onClose()} title={draft ? 'Editar borrador' : 'Nuevo comunicado'} description="Se manda por mail. Las respuestas le llegan a quien lo envía." wide>
        <form
          className="flex flex-col gap-5 px-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault()
            setConfirming(true)
          }}
        >
          <Field id="subject" label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={150} error={fieldErrors.subject} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="body">Mensaje</Label>
              <Segmented
                label="Modo"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'escribir', label: 'Escribir' },
                  { value: 'vista', label: 'Vista previa' },
                ]}
              />
            </div>
            {tab === 'escribir' ? (
              <>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} maxLength={10000} required aria-invalid={fieldErrors.body ? true : undefined} />
                <p className="text-xs text-muted-foreground">Formato: **negrita**, *cursiva*, listas con «- » y links [texto](https://…).</p>
              </>
            ) : (
              <EmailPreview clubName={clubName} subject={subject} body={body} />
            )}
            {fieldErrors.body && <p className="text-sm text-destructive">{fieldErrors.body}</p>}
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold">Destinatarios</legend>

            {categories.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Categorías</span>
                <ul className="flex flex-col divide-y rounded-lg border">
                  {categories.map((c) => {
                    const g = groups[c.id] ?? NONE
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span className={cn('text-sm', (g.players || g.tutors || g.coaches) && 'font-semibold')}>{c.name}</span>
                        <span className="flex gap-1" role="group" aria-label={`Destinatarios de ${c.name}`}>
                          {(
                            [
                              ['players', 'Jugadores'],
                              ['tutors', 'Tutores'],
                              ['coaches', 'Profes'],
                            ] as const
                          ).map(([key, label]) => (
                            <Chip key={key} pressed={g[key]} onClick={() => toggle(c.id, key)}>
                              {label}
                            </Chip>
                          ))}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <PlayerPicker players={players} setPlayers={setPlayers} groups={playerGroups} setGroups={setPlayerGroups} />

            {canWriteStaff && (roles.length > 0 || users.length > 0) && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Staff del club</span>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <Chip key={r.slug} pressed={roleSlugs.includes(r.slug)} onClick={() => setRoleSlugs((all) => (all.includes(r.slug) ? all.filter((s) => s !== r.slug) : [...all, r.slug]))}>
                      {r.name}
                    </Chip>
                  ))}
                </div>
                {users.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {users.map((u) => (
                      <Chip key={u.id} pressed={userIds.includes(u.id)} onClick={() => setUserIds((all) => (all.includes(u.id) ? all.filter((x) => x !== u.id) : [...all, u.id]))}>
                        {u.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div role="status" aria-live="polite" className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {!hasTarget ? (
                <span className="text-muted-foreground">Elegí al menos un grupo.</span>
              ) : preview === null ? (
                <span className="text-muted-foreground">Contando…</span>
              ) : 'error' in preview ? (
                <span className="text-destructive">{preview.error}</span>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <Mail className="size-4 text-primary" aria-hidden="true" />
                    Llega a {preview.count} {preview.count === 1 ? 'persona' : 'personas'}
                  </span>
                  {preview.without > 0 && (
                    <span className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                      {preview.without} sin email: {preview.names.join(', ')}
                      {preview.without > preview.names.length ? '…' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            {fieldErrors.audience && <p className="text-sm text-destructive">{fieldErrors.audience}</p>}
          </fieldset>

          <FormError message={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="gap-2" disabled={pending || !count || !subject.trim() || !body.trim()}>
              <Send className="size-4" aria-hidden="true" />
              Enviar…
            </Button>
            <Button type="button" variant="outline" disabled={pending || !subject.trim()} onClick={() => saveDraft()}>
              Guardar borrador
            </Button>
            {id && (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-destructive"
                disabled={pending}
                onClick={() => execute(() => deleteAnnouncementAction(id), onClose)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar borrador
              </Button>
            )}
          </div>
        </form>
      </ConfigSheet>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Enviar el comunicado?</DialogTitle>
            <DialogDescription>
              «{subject}» le llega a {count} {count === 1 ? 'persona' : 'personas'}. Una vez enviado no se puede editar ni cancelar.
            </DialogDescription>
          </DialogHeader>
          <FormError message={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              className="gap-2"
              disabled={pending}
              onClick={() => {
                let sentId = id
                execute(
                  async () => {
                    // Guarda los últimos cambios sin avisar y después envía: un solo mensaje.
                    const saved = await saveDraftAction(id, input)
                    if (!saved.ok || !saved.id) return saved
                    sentId = saved.id
                    setId(saved.id)
                    return sendAnnouncementAction(saved.id)
                  },
                  () => {
                    setConfirming(false)
                    onClose()
                    router.replace(`${pathname}?comunicado=${sentId}`, { scroll: false })
                  },
                )
              }}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Enviar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition',
        pressed ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function PlayerPicker({
  players,
  setPlayers,
  groups,
  setGroups,
}: {
  players: Named[]
  setPlayers: React.Dispatch<React.SetStateAction<Named[]>>
  groups: { players: boolean; tutors: boolean }
  setGroups: React.Dispatch<React.SetStateAction<{ players: boolean; tutors: boolean }>>
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Named[]>([])

  useEffect(() => {
    if (search.trim().length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const found = await searchPlayersAction(search)
      if (!cancelled) setResults(found)
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const shown = search.trim().length < 2 ? [] : results.filter((r) => !players.some((p) => p.id === r.id))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="player-search" className="text-xs font-medium text-muted-foreground">
          Jugadores sueltos
        </Label>
        {players.length > 0 && (
          <span className="flex gap-1" role="group" aria-label="Destinatarios de los jugadores sueltos">
            <Chip pressed={groups.players} onClick={() => setGroups((g) => ({ ...g, players: !g.players }))}>
              Jugadores
            </Chip>
            <Chip pressed={groups.tutors} onClick={() => setGroups((g) => ({ ...g, tutors: !g.tutors }))}>
              Tutores
            </Chip>
          </span>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input id="player-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o apellido" className="pl-8" autoComplete="off" />
      </div>
      {shown.length > 0 && (
        <ul className="flex flex-col rounded-lg border" aria-label="Resultados">
          {shown.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setPlayers((all) => [...all, p])
                  setSearch('')
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {players.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Jugadores elegidos">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-2.5 text-xs">
              {p.name}
              <button type="button" aria-label={`Quitar a ${p.name}`} className="rounded-full p-0.5 hover:bg-background" onClick={() => setPlayers((all) => all.filter((x) => x.id !== p.id))}>
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
