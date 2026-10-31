import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GroupResponses } from '@/components/callup/group-responses'
import { CallupDetails, CallupHeader, CallupNotice, PublicShell } from '@/components/callup/public-callup'
import { loadPublicCallup } from '../load'
import { callupMetadata } from '../meta'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  return callupMetadata(await loadPublicCallup(token))
}

/**
 * Convocatoria del grupo (FRO-36): el link que el profe comparte en WhatsApp. Cada convocado
 * toca su nombre y responde. Sin login.
 */
export default async function PublicCallupPage({ params }: Props) {
  const { token } = await params
  const page = await loadPublicCallup(token)
  if (!page) notFound()
  const closed = page.match.status === 'played' || page.match.status === 'cancelled'

  return (
    <PublicShell club={page.club}>
      <CallupHeader page={page} />
      <CallupNotice match={page.match} />
      <GroupResponses token={token} initial={page.players} closed={closed} />
      <CallupDetails page={page} token={token} />
    </PublicShell>
  )
}
