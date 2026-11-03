import { LinkIcon } from 'lucide-react'
import { PublicShell } from '@/components/callup/public-callup'

export default function InvalidCallupLink() {
  return (
    <PublicShell>
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <LinkIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold">Link no válido o vencido</h1>
        <p className="text-sm text-muted-foreground">
          Puede que la convocatoria se haya actualizado o que el link esté incompleto. Pedile al profe que te lo vuelva a mandar.
        </p>
      </div>
    </PublicShell>
  )
}
