import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Schemas } from '@/lib/api/client'

const mocks = vi.hoisted(() => ({
  createPlayerAction: vi.fn(),
  updatePlayerAction: vi.fn(),
  selectTenant: vi.fn(async (_previous: unknown, formData: FormData) => {
    mocks.selectedTenant = String(formData.get('slug') ?? '')
    return {}
  }),
  selectedTenant: '',
}))

vi.mock('@/app/(app)/c/[club]/jugadores/actions', () => ({
  createPlayerAction: mocks.createPlayerAction,
  updatePlayerAction: mocks.updatePlayerAction,
}))

vi.mock('@/lib/auth', () => ({
  selectTenant: mocks.selectTenant,
}))

import { RoleChecklist } from '@/components/admin/role-checklist'
import { PermissionGrid } from '@/components/admin/permission-grid'
import { ClubSelector } from '@/components/club/club-selector'
import { PlayerForm } from '@/components/club/players/player-form'
import { canSeeConfig, filterBySportScope, visibleConfigTabs } from '@/lib/club-config'
import type { Player } from '@/lib/api/players'

describe('effective-permission navigation', () => {
  it('shows only seasons, categories, and competitions for a read-only sport coordinator permission set', () => {
    expect(visibleConfigTabs(['seasons.view', 'categories.view', 'competitions.view']).map((tab) => tab.id)).toEqual([
      'temporadas',
      'categorias',
      'competencias',
    ])
  })

  it('adds options granted by another effective role', () => {
    expect(visibleConfigTabs(['seasons.view', 'categories.view', 'competitions.view', 'sports.view']).map((tab) => tab.id)).toEqual([
      'deportes',
      'temporadas',
      'categorias',
      'competencias',
    ])
    expect(canSeeConfig(['venues.view'])).toBe(true)
  })

  it('filters sports-scoped data to the assigned sports', () => {
    const categories = [
      { id: 1, sport_id: 12 },
      { id: 2, sport_id: 18 },
    ]

    expect(filterBySportScope(categories, 'sport', [12])).toEqual([{ id: 1, sport_id: 12 }])
    expect(filterBySportScope(categories, 'all', [12])).toEqual(categories)
  })
})

describe('retired role assignment', () => {
  it('does not offer coordinator and asks admins to review existing assignments', () => {
    render(
      <RoleChecklist
        idPrefix="roles-test"
        roles={[
          { slug: 'coordinator', name: 'Coordinador', description: null, is_system: true },
          { slug: 'sport_coordinator', name: 'Coordinador de deporte', description: null, is_system: true },
        ]}
        defaultSelected={['coordinator']}
      />,
    )

    expect(screen.queryByLabelText('Coordinador')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Coordinador de deporte')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Revisá y reasigná sus accesos manualmente')
  })

  describe('sport permission scopes', () => {
    it('displays and preserves an existing sport scope without making it a general assignment option', () => {
      render(
        <PermissionGrid
          modules={[
            {
              key: 'players',
              label: 'Jugadores',
              resources: [
                {
                  key: 'players',
                  label: 'Jugadores',
                  actions: [{ name: 'players.view', action: 'view', label: 'Ver', scopable: true }],
                },
              ],
            },
          ]}
          value={{ 'players.view': 'sport' }}
        />,
      )

      const scope = screen.getByRole('combobox', { name: 'Alcance de Jugadores: Ver' })
      expect(scope).toHaveValue('sport')
      expect(within(scope).getByRole('option', { name: 'Deportes asignados (actual)' })).toBeDisabled()
    })
  })
})

describe('player form transition', () => {
  const player: Player = {
    id: 42,
    first_name: 'Ana',
    last_name: 'Pérez',
    birth_date: '2008-02-01',
    gender: 'female',
    age: 18,
    document_number: null,
    registration_number: null,
    preferred_position: 'Arquera',
    dominant_side: null,
    status: 'active',
    notes: null,
    created_at: null,
    updated_at: null,
  }

  beforeEach(() => {
    mocks.updatePlayerAction.mockReset().mockResolvedValue({ ok: true, message: 'Ficha actualizada.' })
  })

  it('preserves the historical preferred_position value during editing', async () => {
    const user = userEvent.setup()
    render(<PlayerForm player={player} onDone={vi.fn()} />)

    const position = screen.getByLabelText('Puesto')
    expect(position).toHaveValue('Arquera')

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await vi.waitFor(() => expect(mocks.updatePlayerAction).toHaveBeenCalled())
    const formData = mocks.updatePlayerAction.mock.calls[0][1] as FormData
    expect(formData.get('preferred_position')).toBe('Arquera')
  })
})

describe('club selection', () => {
  const tenants: Schemas['TenantSummaryResource'][] = [
    {
      slug: 'club-a',
      name: 'Club A',
      short_name: 'A',
      city: null,
      founded_year: null,
      primary_color: null,
      logo_url: null,
    },
    {
      slug: 'club-b',
      name: 'Club B',
      short_name: 'B',
      city: null,
      founded_year: null,
      primary_color: null,
      logo_url: null,
    },
  ]

  beforeEach(() => {
    mocks.selectTenant.mockClear()
    mocks.selectedTenant = ''
  })

  it('shows every membership and submits the selected club slug', async () => {
    const user = userEvent.setup()
    render(<ClubSelector tenants={tenants} />)

    expect(screen.getByRole('heading', { name: 'Club A' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Club B' })).toBeInTheDocument()

    const clubBCard = screen.getByRole('heading', { name: 'Club B' }).closest('li')
    expect(clubBCard).not.toBeNull()
    await user.click(within(clubBCard!).getByRole('button', { name: /entrar/i }))

    await vi.waitFor(() => expect(mocks.selectTenant).toHaveBeenCalled())
    expect(mocks.selectedTenant).toBe('club-b')
  })
})
