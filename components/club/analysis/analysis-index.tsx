'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, ChevronRight } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { Meter, ModuleHeader, PageBody, Pill, Segmented } from '@/components/club/shared'
import { PERIODS, rateTone, RESULT, type CategoryStats } from './shared'

/** Entrada al módulo: una fila por categoría; cada una abre su tablero. */
export function AnalysisIndex({ period, categories }: { period: string; categories: CategoryStats[] }) {
  const router = useRouter()
  const pathname = usePathname()
  // Primero las que tienen plantel: las vacías no tienen nada para analizar todavía.
  const sorted = [...categories].sort((a, b) => Number(b.players > 0) - Number(a.players > 0) || a.category_name.localeCompare(b.category_name, 'es'))

  return (
    <>
      <ModuleHeader
        title="Análisis"
        description="Elegí una categoría para ver su tablero: asistencia, resultados y la evolución de cada jugador."
        actions={<Segmented label="Período" value={period} onChange={(v) => router.replace(`${pathname}?periodo=${v}`, { scroll: false })} options={PERIODS.map((p) => ({ ...p }))} />}
      />
      <PageBody>
        {sorted.length === 0 ? (
          <EmptyConfig icon={Activity} title="No hay categorías activas" description="Cuando el club tenga categorías con jugadores, acá aparece cada una con su asistencia y sus resultados." />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <caption className="sr-only">Categorías con su asistencia y resultados del período</caption>
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Categoría</th>
                  <th scope="col" className="w-56 px-4 py-2.5 font-medium">Asistencia</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Partidos</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Últimos resultados</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Evaluaciones</th>
                  <th scope="col" className="w-10 px-2 py-2.5"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((c) => {
                  const empty = c.players === 0
                  return (
                    <tr key={c.category_id} className="group relative transition-colors hover:bg-muted/40 focus-within:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`${pathname}/${c.category_id}${period !== '90' ? `?periodo=${period}` : ''}`}
                          className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                          {c.category_name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{empty ? 'Sin jugadores' : `${c.players} jugadores · ${c.sessions} sesiones`}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.attendance.rate === null ? (
                          <span className="text-muted-foreground">Sin registros</span>
                        ) : (
                          <span className="flex items-center gap-3">
                            <Meter value={c.attendance.rate} tone={rateTone(c.attendance.rate)} />
                            <span className="w-10 text-right font-medium tabular-nums">{c.attendance.rate}%</span>
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                        {c.results.played ? (
                          <>
                            {c.results.won}G · {c.results.drawn}E · {c.results.lost}P
                            <span className="block text-xs text-muted-foreground">{c.results.played} jugados</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Sin partidos</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {c.results.form.length ? (
                          <span className="flex gap-1" aria-label={`Últimos resultados: ${c.results.form.map((f) => RESULT[f].label).join(', ')}`}>
                            {c.results.form.map((f, i) => (
                              <Pill key={i} tone={RESULT[f].tone} className="px-1.5">
                                {RESULT[f].short}
                              </Pill>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{c.evaluations}</td>
                      <td className="px-2 py-3 text-muted-foreground">
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  )
}
