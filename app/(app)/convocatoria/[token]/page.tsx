import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CallupDetails, CallupHeader, CallupNotice, PublicShell } from '@/components/callup/public-callup'
import { loadPublicCallup } from '../load'
import { callupMetadata } from '../meta'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  return callupMetadata(await loadPublicCallup(token))
}

/** Convocatoria pública (FRO-36): la que se comparte en el grupo de WhatsApp. Sin login. */
export default async function PublicCallupPage({ params }: Props) {
  const { token } = await params
  const page = await loadPublicCallup(token)
  if (!page) notFound()

  return (
    <PublicShell>
      <CallupHeader page={page} />
      <div className="flex flex-col gap-4 px-4">
        <CallupNotice match={page.match} />
        <p className="rounded-2xl border border-dashed bg-card/50 p-4 text-center text-sm text-muted-foreground">
          Para confirmar si vas, usá el link personal que te mandó el profe.
        </p>
        <CallupDetails page={page} calendarHref={`/convocatoria/${encodeURIComponent(token)}/calendario`} />
      </div>
    </PublicShell>
  )
}
