'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Tema claro u oscuro del sistema interno. Arranca con el del sistema operativo y recuerda la elección. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
