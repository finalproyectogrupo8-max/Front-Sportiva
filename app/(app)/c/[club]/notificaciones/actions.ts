'use server'

import { markAllNotificationsRead, markNotificationRead } from '@/lib/api/home'

export async function markReadAction(id: number): Promise<boolean> {
  if (!Number.isInteger(id)) return false
  const result = await markNotificationRead(id).catch(() => null)
  return Boolean(result?.ok)
}

export async function markAllReadAction(): Promise<boolean> {
  const result = await markAllNotificationsRead().catch(() => null)
  return Boolean(result?.ok)
}
