// Rama de las categorías y género de los jugadores (FRO-40 / TIZ-40). Opcionales: sin dato no bloquea.

export const BRANCHES = { female: 'Femenino', male: 'Masculino', mixed: 'Mixto' } as const
export const GENDERS = { female: 'Femenino', male: 'Masculino', other: 'Otro' } as const

export type Branch = keyof typeof BRANCHES
export type Gender = keyof typeof GENDERS

export const isBranch = (v: string | null | undefined): v is Branch => !!v && v in BRANCHES
export const isGender = (v: string | null | undefined): v is Gender => !!v && v in GENDERS

/** "Sub 21" + femenino → "Sub 21 · Femenino", salvo que el nombre ya diga la rama. */
export function withBranch(name: string, branch: string | null | undefined): string {
  if (!isBranch(branch)) return name
  const label = BRANCHES[branch]
  return name.toLowerCase().includes(label.toLowerCase().slice(0, 5)) ? name : `${name} · ${label}`
}
