'use client'

import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Barra de las vistas imprimibles (FRO-29): no sale en el papel. Guardar como PDF se elige al imprimir. */
export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
      <a href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver
      </a>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">Para el PDF, elegí «Guardar como PDF» al imprimir.</span>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
