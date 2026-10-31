export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10" aria-busy="true">
      <span className="sr-only">Cargando la configuración…</span>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
    </div>
  )
}
