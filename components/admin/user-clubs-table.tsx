'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Building2, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  associateUserAction,
  listClubsForUserAction,
  listTenantRolesAction,
  type ClubOption,
  type ClubsForUser,
  type UserClub,
} from '@/app/(app)/admin/clubes/[id]/actions'
import { RoleChecklist } from '@/components/admin/role-checklist'
import type { ClubRole } from '@/lib/api/admin'

type Props = {
  user: { id: number; name: string }
  /** Se llama después de cada asociación que sale bien. */
  onAssociated?: (club: ClubOption) => void
}

const CLUB_STATUS_LABEL: Record<string, string> = {
  provisioning: 'Club aprovisionando',
  suspended: 'Club suspendido',
  failed: 'Club con error',
}

/**
 * Clubes del usuario: primero los que ya tiene (con el estado de su membresía) y después los clubes
 * activos a los que se lo puede asociar, con un botón en cada uno.
 * Sin toasts: la fila misma muestra "Asociado" o el error (un toast taparía los botones del panel).
 */
export function UserClubsTable({ user, onAssociated }: Props) {
  const [data, setData] = useState<ClubsForUser | null>(null)
  const [associated, setAssociated] = useState<Set<number>>(new Set())
  const [, startLoading] = useTransition()

  useEffect(() => {
    startLoading(async () => setData(await listClubsForUserAction(user.id)))
  }, [user.id])

  if (data === null) {
    return (
      <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Cargando clubes...
      </div>
    )
  }

  if (!data.ok) {
    return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{data.error}</p>
  }

  if (data.memberOf.length === 0 && data.available.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
        <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No hay clubes activos todavía.</p>
        <Link href="/admin/clubes" className="text-xs font-medium text-primary hover:underline">
          Ir a Clubes
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Clubes de {user.name}</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2">
                Club
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Membresía
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.memberOf.map((club) => (
              <MemberRow key={club.id} club={club} />
            ))}
            {data.available.map((club) => (
              <AvailableRow
                key={club.id}
                club={club}
                userId={user.id}
                userName={user.name}
                done={associated.has(club.id)}
                onDone={() => {
                  setAssociated((prev) => new Set(prev).add(club.id))
                  onAssociated?.(club)
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      {data.available.length > 0 ? (
        <p className="text-xs text-muted-foreground">Al asociarlo elegís sus roles en ese club.</p>
      ) : (
        <p className="text-xs text-muted-foreground">Ya está asociado a todos los clubes activos.</p>
      )}
    </div>
  )
}

function ClubCell({ club, extra }: { club: ClubOption; extra?: React.ReactNode }) {
  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-[10px] font-semibold text-primary">
          {club.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{club.name}</span>
          <code className="font-mono text-[11px] text-muted-foreground">{club.slug}</code>
          {extra}
        </div>
      </div>
    </td>
  )
}

function MemberRow({ club }: { club: UserClub }) {
  const clubNote = CLUB_STATUS_LABEL[club.clubStatus]

  return (
    <tr className="bg-muted/20">
      <ClubCell
        club={club}
        extra={clubNote && <span className="text-[11px] text-amber-700 dark:text-amber-400">{clubNote}</span>}
      />
      <td className="px-3 py-2 text-right">
        {club.membershipActive ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/25 bg-emerald-500/10 text-xs font-normal text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Ya es miembro
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground">
            <XCircle className="size-3" aria-hidden="true" />
            Desactivado
          </Badge>
        )}
      </td>
    </tr>
  )
}

function AvailableRow({
  club,
  userId,
  userName,
  done,
  onDone,
}: {
  club: ClubOption
  userId: number
  userName: string
  done: boolean
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  /** null: todavía no se eligió asociar. Con roles: muestra la lista para elegir. */
  const [roles, setRoles] = useState<ClubRole[] | null>(null)

  const handleOpen = () => {
    setError(null)
    startTransition(async () => {
      const res = await listTenantRolesAction(club.id)
      if (res.ok) setRoles(res.roles)
      else setError(res.error)
    })
  }

  const handleAssociate = (formData: FormData) => {
    setError(null)
    const selected = formData.getAll('roles').map(String)
    startTransition(async () => {
      const res = await associateUserAction(club.id, userId, selected)
      if (res.ok) {
        setRoles(null)
        onDone()
      } else {
        setError(res.error || `No se pudo asociar a ${userName}.`)
      }
    })
  }

  return (
    <>
      <tr>
        <ClubCell club={club} extra={error && <span className="text-xs text-destructive">{error}</span>} />
        <td className="px-3 py-2 text-right">
          {done ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Asociado
            </span>
          ) : roles === null ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpen}
              disabled={pending}
              className="h-7 cursor-pointer gap-1 border-primary/25 bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/15 hover:text-primary"
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                <Building2 className="size-3" aria-hidden="true" />
              )}
              Asociar
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRoles(null)}
              disabled={pending}
              className="h-7 cursor-pointer px-2 text-xs"
            >
              Cancelar
            </Button>
          )}
        </td>
      </tr>
      {roles !== null && !done && (
        <tr>
          <td colSpan={2} className="bg-muted/20 px-3 pb-3">
            <form action={handleAssociate} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Roles en {club.name}</span>
              <RoleChecklist roles={roles} disabled={pending} idPrefix={`associate-${club.id}`} />
              <Button type="submit" size="sm" disabled={pending || roles.length === 0} className="cursor-pointer gap-1 self-end">
                {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                Asociar con estos roles
              </Button>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
