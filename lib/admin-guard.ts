import { requireSession } from '@/lib/auth'

export async function requirePlatformAdmin(): Promise<void> {
  await requireSession()

  // TODO: When /me returns is_platform_admin, verify it and redirect to /clubes if false.
}
