import Link from 'next/link'
import { Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/** Módulo que el rol del usuario no habilita. La API igual rechaza sus datos con 403. */
export function NoAccess({ moduleName, homeHref }: { moduleName: string; homeHref: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-foreground">No tenés acceso a {moduleName}</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Tu rol en el club no incluye este módulo. Si lo necesitás, pedíselo a un administrador del club.
        </p>
      </div>
      <Link href={homeHref} className={buttonVariants()}>
        Volver al inicio
      </Link>
    </div>
  )
}
