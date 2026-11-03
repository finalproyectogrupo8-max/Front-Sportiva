// Etiquetas en español para el registro de actividad (FRO-30). Las acciones desconocidas se
// muestran tal cual llegan de la API: nunca se inventa un texto para algo que no conocemos.

import type { ActivityChanges, ActivityChangeValue } from '@/lib/api/activity'

const PLATFORM_ACTION_LABELS: Record<string, string> = {
  'user.created': 'Usuario creado',
  'user.updated': 'Usuario actualizado',
  'user.deleted': 'Usuario dado de baja',
  'user.deactivated': 'Usuario desactivado',
  'user.activated': 'Usuario activado',
  'user.password_reset_completed': 'Contraseña restablecida',
  'user.password_reset_requested': 'Restablecimiento de contraseña pedido',
  'user.password_reset_requested_by_admin': 'Restablecimiento de contraseña enviado',
  'auth.password_reset': 'Contraseña restablecida',
  'auth.password_reset_requested': 'Restablecimiento de contraseña pedido',
  'tenant.created': 'Club creado',
  'tenant.updated': 'Club actualizado',
  'tenant.deleted': 'Club dado de baja',
  'membership.created': 'Miembro agregado',
  'membership.updated': 'Membresía actualizada',
  'membership.roles_updated': 'Roles del miembro actualizados',
  'membership.deleted': 'Miembro quitado',
  'document.downloaded': 'Documento descargado',
  'document.deleted': 'Documento eliminado',
}

const CLUB_ACTION_LABELS: Record<string, string> = {
  'order.approved': 'Pedido aprobado',
  'order.rejected': 'Pedido rechazado',
  'order.delivered': 'Pedido entregado',
  'order.partially_delivered': 'Pedido entregado parcialmente',
  'player.deleted': 'Jugador eliminado',
  'club_user.added': 'Miembro agregado',
  'club_user.roles_updated': 'Roles actualizados',
  'club_user.enabled': 'Acceso devuelto',
  'club_user.disabled': 'Acceso quitado',
  'announcement.sent': 'Comunicado enviado',
}

/** Etiquetas de los campos que aparecen en `changes` (plataforma). */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  email: 'Email',
  slug: 'Slug',
  database_name: 'Base de datos',
  status: 'Estado',
  short_name: 'Nombre corto',
  city: 'Ciudad',
  founded_year: 'Año de fundación',
  primary_color: 'Color',
  logo_path: 'Logo',
  is_active: 'Activo',
  is_platform_admin: 'Admin de plataforma',
  roles: 'Roles',
  user_id: 'Usuario',
  tenant_id: 'Club',
  tenant: 'Club',
  kind: 'Tipo',
  owner: 'Dueño',
  password: 'Contraseña',
}

export function platformActionLabel(action: string): string {
  return PLATFORM_ACTION_LABELS[action] ?? action
}

export function clubActionLabel(action: string): string {
  return CLUB_ACTION_LABELS[action] ?? action
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

/** Valor legible para un cambio: booleanos, listas y escalares. */
export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.length > 0 ? value.map((v) => String(v)).join(', ') : '—'
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.name === 'string') return record.name
    if (typeof record.email === 'string') return record.email
    return '—'
  }

  return String(value)
}

export type ChangeLine = { field: string; text: string }

/**
 * Convierte `changes` en líneas "Campo: antes → después". Acepta el formato documentado
 * (`{from, to}`), el de contraseña (`{changed: true}`) y los escalares de documentos.
 */
export function describePlatformChanges(changes: ActivityChanges | null): ChangeLine[] {
  if (!changes) return []

  return Object.entries(changes).map(([field, value]) => {
    const label = fieldLabel(field)

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const change = value as Exclude<ActivityChangeValue, string | number | boolean | null>
      if ('from' in change || 'to' in change) {
        return {
          field: label,
          text: `${formatChangeValue(change.from)} → ${formatChangeValue(change.to)}`,
        }
      }
      if (change.changed) {
        return { field: label, text: 'Actualizado' }
      }
    }

    return { field: label, text: formatChangeValue(value) }
  })
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function rolesText(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const roles = value as { from?: unknown; to?: unknown }
  const from = stringList(roles.from)
  const to = stringList(roles.to)

  if (from.length === 0 && to.length === 0) return null
  if (from.length === 0) return `Roles: ${to.join(', ')}`

  return `Roles: ${from.length > 0 ? from.join(', ') : '—'} → ${to.length > 0 ? to.join(', ') : '—'}`
}

/**
 * Detalle corto de un evento del club a partir de `metadata`:
 * número de pedido, nombre del jugador, roles antes/después o asunto del comunicado.
 * Devuelve null si no hay nada útil para mostrar.
 */
export function describeClubActivity(
  action: string,
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null

  if (action.startsWith('order.')) {
    const parts: string[] = []
    const number = stringValue(metadata.number) ?? (metadata.number != null ? String(metadata.number) : null)
    if (number) parts.push(`Pedido #${number}`)
    const reason = stringValue(metadata.reason)
    if (reason) parts.push(`Motivo: ${reason}`)
    const comment = stringValue(metadata.comment)
    if (comment) parts.push(`Comentario: ${comment}`)
    return parts.length > 0 ? parts.join(' · ') : null
  }

  if (action === 'player.deleted') {
    const name = stringValue(metadata.name)
    return name ? `Jugador: ${name}` : null
  }

  if (action.startsWith('club_user.')) {
    const name = stringValue(metadata.name)
    const roles = rolesText(metadata.roles)
    return [name, roles].filter(Boolean).join(' · ') || null
  }

  if (action === 'announcement.sent') {
    const subject = stringValue(metadata.subject)
    const recipients = typeof metadata.recipients === 'number' ? metadata.recipients : null
    const parts: string[] = []
    if (subject) parts.push(`Asunto: ${subject}`)
    if (recipients !== null) parts.push(`${recipients} destinatario${recipients === 1 ? '' : 's'}`)
    return parts.length > 0 ? parts.join(' · ') : null
  }

  return null
}
