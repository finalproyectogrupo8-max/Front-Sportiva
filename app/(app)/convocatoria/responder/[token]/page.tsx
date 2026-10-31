import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CallupDetails, CallupHeader, CallupNotice, PublicShell } from '@/components/callup/public-callup'
import { ResponseForm } from '@/components/callup/response-form'
import { loadPersonalCallup } from '../../load'
import { callupMetadata } from '../../meta'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  return callupMetadata((await loadPersonalCallup(token))?.page ?? null)
}

/** Link personal de cada convocado (FRO-36): confirmar con "Voy" o "No puedo". Sin login. */
export default async function RespondCallupPage({ params }: Props) {
  const { token } = await params
  const data = await loadPersonalCallup(token)
  if (!data) notFound()
  const { page, me } = data
  const closed = page.match.status === 'played' || page.match.status === 'cancelled'

  return (
    <PublicShell>
      <CallupHeader page={page} />
      <div className="flex flex-col gap-4 px-4">
        <CallupNotice match={page.match} />
        <ResponseForm token={token} initial={me} closed={closed} />
        <CallupDetails page={page} calendarHref={`/convocatoria/${encodeURIComponent(token)}/calendario`} />
      </div>
    </PublicShell>
  )
}
