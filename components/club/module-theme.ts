export type ModuleTheme = {
  id: string
  name: string
  bgImage: string
  isPhoto: boolean
  bgImageClass: string
  glowStyle: string
  overlayClass: string
}

export const MODULE_THEMES: Record<string, ModuleTheme> = {
  partidos: {
    id: 'partidos',
    name: 'Partidos',
    bgImage: '/images/contact-stadium.jpg',
    isPhoto: true,
    bgImageClass: 'opacity-40 dark:opacity-75 scale-105 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 80% 25%, rgba(200, 118, 80, 0.35) 0%, rgba(42, 119, 76, 0.25) 45%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/80 via-background/50 to-background/90 dark:from-[#10100f]/80 dark:via-[#10100f]/50 dark:to-[#10100f]/85',
  },
  jugadores: {
    id: 'jugadores',
    name: 'Jugadores',
    bgImage: '/images/tactical-board.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 80% 30%, rgba(200, 118, 80, 0.30) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  analisis: {
    id: 'analisis',
    name: 'Análisis',
    bgImage: '/images/analisis-grid.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 80% 35%, rgba(200, 118, 80, 0.28) 0%, rgba(30, 80, 120, 0.22) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  competencia: {
    id: 'competencia',
    name: 'Proyecto',
    bgImage: '/images/competencia-arena.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 50% 30%, rgba(226, 163, 54, 0.32) 0%, rgba(200, 118, 80, 0.22) 45%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  profes: {
    id: 'profes',
    name: 'Profes',
    bgImage: '/images/profes-playbook.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 80% 30%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  indumentaria: {
    id: 'indumentaria',
    name: 'Indumentaria',
    bgImage: '/images/indumentaria-textile.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 85% 35%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  materiales: {
    id: 'materiales',
    name: 'Materiales',
    bgImage: '/images/materiales-storage.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 80% 35%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  canchas: {
    id: 'canchas',
    name: 'Canchas',
    bgImage: '/images/court-pattern.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 50% 35%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  dashboard: {
    id: 'dashboard',
    name: 'Hoy en el club',
    bgImage: '/images/club-gym.png',
    isPhoto: true,
    bgImageClass: 'opacity-40 dark:opacity-65 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 75% 25%, rgba(200, 118, 80, 0.32) 0%, rgba(212, 186, 163, 0.12) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/80 via-background/50 to-background/90 dark:from-[#10100f]/80 dark:via-[#10100f]/50 dark:to-[#10100f]/85',
  },
  admin: {
    id: 'admin',
    name: 'Administración',
    bgImage: '/images/admin-grid.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 70% 30%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
  clubes: {
    id: 'clubes',
    name: 'Clubes',
    bgImage: '/images/court-pattern.svg',
    isPhoto: false,
    bgImageClass: 'opacity-50 dark:opacity-75 mix-blend-multiply dark:mix-blend-normal',
    glowStyle:
      'radial-gradient(circle at 50% 30%, rgba(200, 118, 80, 0.28) 0%, rgba(212, 186, 163, 0.15) 50%, transparent 75%)',
    overlayClass:
      'bg-gradient-to-b from-background/75 via-background/45 to-background/85 dark:from-[#10100f]/75 dark:via-[#10100f]/45 dark:to-[#10100f]/80',
  },
}

export function getModuleTheme(moduleId?: string): ModuleTheme {
  if (moduleId && MODULE_THEMES[moduleId]) {
    return MODULE_THEMES[moduleId]
  }
  return MODULE_THEMES.dashboard
}
