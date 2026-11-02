import { AlertTriangle, Download, Mail, Search } from 'lucide-react'
import { Pagination } from '@/components/admin/pagination'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getNewsletterSubscribers } from '@/lib/api/admin'
import { formatShortDate } from '@/lib/format-date'
import { requirePlatformAdmin } from '@/lib/session'

export const metadata = { title: 'Newsletter | Admin Sportiva' }

export default async function AdminNewsletterPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePlatformAdmin()
  const params = await searchParams
  const search = params.q?.trim() || undefined
  const page = Math.max(1, Number(params.page) || 1)

  let result
  try {
    result = await getNewsletterSubscribers({ search, page })
  } catch {
    result = null
  }

  return (
    <div className="mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">Newsletter</h1>
          <p className="text-sm text-muted-foreground">
            Quienes se suscribieron desde la landing{result?.ok ? ` · ${result.data.meta.total} en total` : ''}.
          </p>
        </div>
        {/* Link normal (no fetch del browser): la descarga la resuelve la ruta del servidor. */}
        <a href="/admin/newsletter/csv" className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
          <Download className="size-4" aria-hidden="true" />
          Descargar CSV
        </a>
      </div>

      <form className="relative max-w-sm" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input name="q" defaultValue={search} placeholder="Buscar por email" className="pl-8" aria-label="Buscar por email" />
      </form>

      {!result || !result.ok ? (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" aria-hidden="true" />
          No se pudo cargar la lista. Probá de nuevo en unos minutos.
        </p>
      ) : result.data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <Mail className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{search ? 'Nadie con ese email.' : 'Todavía no se suscribió nadie.'}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Suscriptores del newsletter</caption>
              <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3 text-right">Se suscribió</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.data.data.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.subscribed_at ? formatShortDate(s.subscribed_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={result.data.meta} label={{ one: 'suscriptor', many: 'suscriptores' }} />
        </>
      )}
    </div>
  )
}
