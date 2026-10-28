'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserClubsTable } from '@/components/admin/user-clubs-table'
import type { AdminUser } from '@/lib/api/admin'

/** Asociar un usuario a clubes desde el listado de usuarios (la otra entrada es el detalle del club). */
export function AssignClubDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false)
  // Cada apertura vuelve a consultar los clubes del usuario.
  const [session, setSession] = useState(0)

  const handleOpenChange = (next: boolean) => {
    if (next) setSession((n) => n + 1)
    setOpen(next)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="h-7 cursor-pointer gap-1 border-primary/25 bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/15 hover:text-primary"
        title={`Asociar a ${user.name} a un club`}
        aria-label={`Asociar a ${user.name} a un club`}
      >
        <Building2 className="size-3" aria-hidden="true" />
        Asociar
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asociar a un club</DialogTitle>
            <DialogDescription>
              {user.name} ({user.email}) va a poder entrar a los clubes con su email y contraseña.
            </DialogDescription>
          </DialogHeader>
          {open && <UserClubsTable key={session} user={user} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
