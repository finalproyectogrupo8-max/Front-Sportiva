export const USER_STATUS_DETAILS = {
  active: {
    label: 'Activo',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  inactive: {
    label: 'Inactivo',
    className: 'border-muted bg-muted/60 text-muted-foreground',
  },
  disabled: {
    label: 'Inactivo',
    className: 'border-muted bg-muted/60 text-muted-foreground',
  },
  invited: {
    label: 'Invitación pendiente',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
} as const

export type UserStatus = keyof typeof USER_STATUS_DETAILS

export function isUserStatus(status: string): status is UserStatus {
  return Object.prototype.hasOwnProperty.call(USER_STATUS_DETAILS, status)
}
