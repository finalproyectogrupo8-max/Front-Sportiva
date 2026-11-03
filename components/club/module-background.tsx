'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getModuleTheme } from './module-theme'

export function PageBackground({
  moduleId,
  className,
}: {
  moduleId?: string
  className?: string
}) {
  const pathname = usePathname()
  const resolvedModule = moduleId ?? pathname?.split('/')[3]
  const theme = getModuleTheme(resolvedModule)

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden select-none',
        className,
      )}
      aria-hidden="true"
    >
      {/* Thematic Sport Background Image / Pattern */}
      <Image
        key={theme.id}
        src={theme.bgImage}
        alt=""
        fill
        priority={theme.isPhoto}
        sizes="100vw"
        quality={theme.isPhoto ? 90 : undefined}
        className={cn(
          'object-cover transition-all duration-700',
          theme.isPhoto ? 'object-center' : 'object-top',
          theme.bgImageClass,
        )}
      />

      {/* Thematic Accent Glow (Stadium floodlights, court flare, telemetry pulse) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: theme.glowStyle }}
      />

      {/* Balanced Contrast Overlay: darkens enough for AA text contrast while keeping background clearly visible */}
      <div className={cn('absolute inset-0 transition-colors duration-700', theme.overlayClass)} />
    </div>
  )
}

export function ModuleHeaderBackground({
  moduleId,
  className,
}: {
  moduleId?: string
  className?: string
}) {
  const pathname = usePathname()
  const resolvedModule = moduleId ?? pathname?.split('/')[3]
  const theme = getModuleTheme(resolvedModule)

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden select-none',
        className,
      )}
      aria-hidden="true"
    >
      {/* Subtle radial floodlight flare specifically behind the header title */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: theme.glowStyle }}
      />
    </div>
  )
}

export function ModuleBodyBackground(): null {
  return null
}
