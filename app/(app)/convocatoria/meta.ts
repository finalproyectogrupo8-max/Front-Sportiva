import type { Metadata } from 'next'
import { matchTitle } from '@/components/callup/public-callup'
import type { PublicCallupPage } from '@/lib/api/public-callups'
import { formatLongDay, formatTime } from '@/lib/club-time'

/** Título y vista previa (Open Graph) para que el link se vea bien al compartirlo por WhatsApp. */
export function callupMetadata(page: PublicCallupPage | null): Metadata {
  if (!page) return { title: 'Link no válido — Sportiva', robots: { index: false } }
  const { club, match } = page
  const title = `Convocatoria ${match.category} ${matchTitle(match)} · ${club.short_name || club.name}`
  const day = formatLongDay(match.match_date)
  const description = `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${
    match.meet_at ? `Presentación ${formatTime(match.meet_at)} h · ` : ''
  }Partido ${formatTime(match.match_date)} h${match.venue ? ` · ${match.venue}` : ''}`
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: club.name,
      type: 'website',
      ...(club.logo_url ? { images: [{ url: club.logo_url, alt: `Escudo de ${club.name}` }] } : {}),
    },
    twitter: { card: 'summary', title, description },
  }
}
