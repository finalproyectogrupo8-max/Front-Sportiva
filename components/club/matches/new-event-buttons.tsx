'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Dumbbell, Swords } from 'lucide-react'
import { ConfigSheet } from '@/components/club/forms'
import { Button } from '@/components/ui/button'
import { MatchForm, type CategoryOption, type CompetitionOption, type VenueOption } from './match-form'
import { TrainingForm } from './training-form'

/** "Nuevo partido" y "Nuevo entrenamiento". El partido nuevo abre su página. */
export function NewEventButtons({
  club,
  categories,
  competitions,
  venues,
  can,
}: {
  club: string
  categories: CategoryOption[]
  competitions: CompetitionOption[]
  venues: VenueOption[]
  can: { match: boolean; training: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState<'match' | 'training' | null>(params.get('nuevo') === '1' && can.match ? 'match' : null)

  if (categories.length === 0 || (!can.match && !can.training)) return null

  return (
    <>
      {can.training && (
        <Button variant="outline" onClick={() => setOpen('training')} className="gap-1.5">
          <Dumbbell className="size-4" aria-hidden="true" />
          Entrenamiento
        </Button>
      )}
      {can.match && (
        <Button onClick={() => setOpen('match')} className="gap-1.5">
          <Swords className="size-4" aria-hidden="true" />
          Nuevo partido
        </Button>
      )}
      <ConfigSheet
        open={open === 'match'}
        onOpenChange={(o) => !o && setOpen(null)}
        title="Nuevo partido"
        description="Con estos datos se arma después la convocatoria que reciben los jugadores."
        wide
      >
        <MatchForm
          club={club}
          venues={venues}
          match={null}
          categories={categories}
          competitions={competitions}
          onDone={(id) => {
            setOpen(null)
            if (id) router.push(`${pathname}/${id}`)
          }}
        />
      </ConfigSheet>
      <ConfigSheet open={open === 'training'} onOpenChange={(o) => !o && setOpen(null)} title="Nuevo entrenamiento">
        <TrainingForm training={null} categories={categories} onDone={() => setOpen(null)} />
      </ConfigSheet>
    </>
  )
}
