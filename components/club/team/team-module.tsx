'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { UserPlus, Users } from 'lucide-react'
import { inviteMemberAction, updateMemberAction } from '@/app/(app)/c/[club]/equipo/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { ModuleHeader, PageBody, Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { CLUB_TZ } from '@/lib/club-time'
import { cn } from '@/lib/utils'

type Member = {
  id: number
  display_name: string
  email: string | null
  status: 'active' | 'disabled'
  roles: { slug: string; name: string }[]
  sport_ids: number[]
  is_self: boolean
  created_at: string | null
}
type Role = { slug: string; name: string; description: string | null; is_system: boolean }
type Named = { id: number; name: string }
type Can = { invite: boolean; update: boolean; disable: boolean }

/** Roles que trabajan con deportes asignados: piden elegirlos. */
const SPORT_ROLES = ['sport_coordinator']

const since = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR', { timeZone: CLUB_TZ, day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export function TeamModule({ members, roles, sports, startInvite, can }: { members: Member[]; roles: Role[]; sports: Named[]; startInvite: boolean; can: Can }) {
  const router = useRouter()
  const pathname = usePathname()
  const [inviting, setInviting] = useState(startInvite && can.invite)
  const [editing, setEditing] = useState<Member | null>(null)
  const [toggling, setToggling] = useState<Member | null>(null)
  const active = members.filter((m) => m.status === 'active')
  const disabled = members.filter((m) => m.status === 'disabled')

  const closeInvite = () => {
    setInviting(false)
    if (startInvite) router.replace(pathname, { scroll: false })
  }

  return (
    <>
      <ModuleHeader
        title="Equipo"
        description="Quiénes trabajan en el club y qué puede hacer cada uno. Los permisos salen de los roles."
        actions={
          can.invite ? (
            <Button className="gap-2" onClick={() => setInviting(true)}>
              <UserPlus className="size-4" aria-hidden="true" />
              Sumar a alguien
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        {members.length === 0 ? (
          <EmptyConfig icon={Users} title="Todavía no hay nadie más" description="Sumá a los profes, coordinadores y al resto del staff con su email." />
        ) : (
          <>
            <MemberTable title={`Con acceso · ${active.length}`} members={active} can={can} onEdit={setEditing} onToggle={setToggling} />
            {disabled.length > 0 && <MemberTable title={`Sin acceso · ${disabled.length}`} members={disabled} can={can} onEdit={setEditing} onToggle={setToggling} muted />}
          </>
        )}
      </PageBody>

      {inviting && <InviteSheet roles={roles} sports={sports} onClose={closeInvite} />}
      {editing && <RolesSheet key={editing.id} member={editing} roles={roles} sports={sports} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.status === 'active' ? `Quitarle el acceso a ${toggling?.display_name}` : `Devolverle el acceso a ${toggling?.display_name}`}
        description={
          toggling?.status === 'active'
            ? 'No va a poder entrar al club. Su historial (partidos, asistencias, pedidos) queda. Se lo podés devolver cuando quieras.'
            : 'Vuelve a entrar con los mismos roles que tenía.'
        }
        confirmLabel={toggling?.status === 'active' ? 'Quitar acceso' : 'Devolver acceso'}
        onConfirm={() =>
          updateMemberAction(
            toggling!.id,
            { status: toggling!.status === 'active' ? 'disabled' : 'active' },
            toggling!.status === 'active' ? `${toggling!.display_name} ya no puede entrar al club.` : `${toggling!.display_name} vuelve a tener acceso.`,
          )
        }
      />
    </>
  )
}

function MemberTable({
  title,
  members,
  can,
  onEdit,
  onToggle,
  muted = false,
}: {
  title: string
  members: Member[]
  can: Can
  onEdit: (m: Member) => void
  onToggle: (m: Member) => void
  muted?: boolean
}) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[620px] table-fixed text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="w-[34%] px-4 py-2.5 font-medium">Persona</th>
              <th scope="col" className="w-[30%] px-4 py-2.5 font-medium">Roles</th>
              <th scope="col" className="hidden w-[16%] px-4 py-2.5 font-medium md:table-cell">En el club desde</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id} className={cn(muted && 'text-muted-foreground')}>
                <td className="px-4 py-3">
                  <span className="font-medium break-words text-foreground">{m.display_name}</span>
                  {m.is_self && <span className="ml-2 text-xs text-muted-foreground">(vos)</span>}
                  <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {m.roles.map((r) => (
                      <Pill key={r.slug} tone={r.slug === 'admin' ? 'info' : 'neutral'}>
                        {r.name}
                      </Pill>
                    ))}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{since(m.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-1">
                    {can.update && m.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(m)} aria-label={`Cambiar los roles de ${m.display_name}`}>
                        Roles
                      </Button>
                    )}
                    {can.disable && !m.is_self && (
                      <Button variant="ghost" size="sm" className={cn(m.status === 'active' && 'text-destructive hover:text-destructive')} onClick={() => onToggle(m)}>
                        {m.status === 'active' ? 'Quitar acceso' : 'Devolver acceso'}
                      </Button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Roles con su descripción: el administrador elige sabiendo qué puede hacer cada uno. */
function RolePicker({ roles, selected, onToggle, error }: { roles: Role[]; selected: string[]; onToggle: (slug: string) => void; error?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Roles</legend>
      <div className={cn('flex flex-col divide-y rounded-lg border', error && 'border-destructive/60')}>
        {roles.map((role) => (
          <label key={role.slug} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
            <input type="checkbox" checked={selected.includes(role.slug)} onChange={() => onToggle(role.slug)} className="mt-0.5 size-4 shrink-0 accent-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">{role.name}</span>
              {role.description && <span className="text-xs text-muted-foreground">{role.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Con varios roles, los permisos se suman.</p>
    </fieldset>
  )
}

function SportPicker({ sports, selected, onToggle }: { sports: Named[]; selected: number[]; onToggle: (id: number) => void }) {
  if (sports.length === 0) return null
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Deportes que coordina</legend>
      <div className="flex flex-wrap gap-2">
        {sports.map((s) => (
          <label key={s.id} className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm', selected.includes(s.id) && 'border-primary bg-primary/10')}>
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => onToggle(s.id)} className="size-4 accent-primary" />
            {s.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

function InviteSheet({ roles, sports, onClose }: { roles: Role[]; sports: Named[]; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [sportIds, setSportIds] = useState<number[]>([])
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const needsSports = selected.some((s) => SPORT_ROLES.includes(s))

  return (
    <ConfigSheet open onOpenChange={(o) => !o && onClose()} title="Sumar a alguien" description="Si todavía no usa Sportiva, le llega un mail para elegir su contraseña.">
      <form
        className="flex flex-col gap-4 px-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault()
          execute(() => inviteMemberAction({ email, name: name || null, roles: selected, ...(needsSports ? { sport_ids: sportIds } : {}) }), onClose)
        }}
      >
        <Field id="invite-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus error={fieldErrors.email} />
        <Field
          id="invite-name"
          label="Nombre y apellido"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Hace falta si todavía no tiene usuario en Sportiva."
          maxLength={255}
          error={fieldErrors.name}
        />
        <RolePicker roles={roles} selected={selected} onToggle={(slug) => setSelected((s) => toggle(s, slug))} error={fieldErrors.roles} />
        {needsSports && <SportPicker sports={sports} selected={sportIds} onToggle={(id) => setSportIds((s) => toggle(s, id))} />}
        <FormError message={error} />
        <SubmitButton pending={pending}>Sumar al equipo</SubmitButton>
      </form>
    </ConfigSheet>
  )
}

function RolesSheet({ member, roles, sports, onClose }: { member: Member; roles: Role[]; sports: Named[]; onClose: () => void }) {
  const [selected, setSelected] = useState(member.roles.map((r) => r.slug))
  const [sportIds, setSportIds] = useState(member.sport_ids)
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const needsSports = selected.some((s) => SPORT_ROLES.includes(s))

  return (
    <ConfigSheet open onOpenChange={(o) => !o && onClose()} title={`Roles de ${member.display_name}`} description={member.email ?? undefined}>
      <form
        className="flex flex-col gap-4 px-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault()
          execute(() => updateMemberAction(member.id, { roles: selected, ...(needsSports ? { sport_ids: sportIds } : {}) }, `Roles de ${member.display_name} actualizados.`), onClose)
        }}
      >
        <RolePicker roles={roles} selected={selected} onToggle={(slug) => setSelected((s) => toggle(s, slug))} error={fieldErrors.roles} />
        {needsSports && <SportPicker sports={sports} selected={sportIds} onToggle={(id) => setSportIds((s) => toggle(s, id))} />}
        {member.is_self && member.roles.some((r) => r.slug === 'admin') && !selected.includes('admin') && (
          <p role="alert" className="rounded-lg bg-warning/15 px-3 py-2 text-sm">
            Te estás sacando el rol de administrador: vas a dejar de poder gestionar el equipo y otras partes del club.
          </p>
        )}
        <FormError message={error} />
        <SubmitButton pending={pending}>Guardar roles</SubmitButton>
      </form>
    </ConfigSheet>
  )
}
