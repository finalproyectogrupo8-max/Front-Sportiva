// CSV para Excel en español (FRO-29): UTF-8 con BOM (acentos), separador `;` y fin de línea CRLF.

type Cell = string | number | null | undefined

function cell(value: Cell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Cell[][]): string {
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n'
}

/** Respuesta de descarga con un nombre de archivo seguro. */
export function csvResponse(rows: Cell[][], filename: string): Response {
  const safe = filename.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safe}"`,
      'Cache-Control': 'no-store',
    },
  })
}
