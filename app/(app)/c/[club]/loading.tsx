// Respaldo para los módulos sin loading propio: la barra del club queda a la vista mientras carga.
export default function Loading() {
  return (
    <div className="flex flex-col" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="border-b bg-card/60">
        <div className="mx-auto flex max-w-[120rem] flex-col gap-3 px-4 py-6 sm:px-6 lg:px-10">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted/70" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[120rem] gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
        ))}
        <div className="h-72 animate-pulse rounded-xl bg-muted/50 sm:col-span-2 lg:col-span-4" />
      </div>
    </div>
  )
}
