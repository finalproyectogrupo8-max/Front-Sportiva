// Hoja A4 para imprimir (FRO-29): blanco y negro, márgenes de 15 mm y la tabla que no se corta mal.
export function PrintSheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/40 px-4 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 15mm; } @media print { html, body { background: #fff !important; } tr { break-inside: avoid; } thead { display: table-header-group; } }`}</style>
      <div className="mx-auto max-w-[210mm] rounded-lg bg-white p-10 text-[13px] leading-snug text-black shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">{children}</div>
    </div>
  )
}

export function PrintHeader({ club, title, subtitle }: { club: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4 border-b-2 border-black pb-3">
      <div>
        <p className="text-xs uppercase tracking-wide">{club}</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm">{subtitle}</p>}
      </div>
      <p className="text-xs">Impreso el {new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
    </header>
  )
}
