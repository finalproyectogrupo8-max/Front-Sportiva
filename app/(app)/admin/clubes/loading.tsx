export default function AdminClubesLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-9 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form Skeleton */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 lg:col-span-4">
          <div className="h-6 w-36 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="flex flex-col gap-2 pt-2">
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-9 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-9 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-2 h-9 w-full rounded bg-muted animate-pulse" />
        </div>

        {/* List Skeleton */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="h-16 rounded-xl border bg-card animate-pulse" />
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-10 border-b bg-muted/40 animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted animate-pulse" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

