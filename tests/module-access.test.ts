import { describe, expect, it } from 'vitest'
import { canOpenModule, visibleModules } from '@/lib/modules'

// Lo que muestra el menú y lo que deja abrir cada página salen de la misma regla.
describe('module access', () => {
  const coach = ['players.view', 'coaches.view', 'matches.view', 'trainings.view', 'attendance.view', 'material_orders.view', 'material_orders.create', 'apparel_items.view', 'apparel_orders.view']

  it('opens every module the menu shows', () => {
    for (const mod of visibleModules(coach)) expect(canOpenModule(mod.id, coach)).toBe(true)
  })

  it('lets a coach into Materiales to request materials without seeing the stock', () => {
    expect(visibleModules(coach).map((m) => m.id)).toContain('materiales')
    expect(canOpenModule('materiales', ['material_orders.view'])).toBe(true)
  })

  it('hides a module when no permission of the page is granted', () => {
    expect(canOpenModule('partidos', ['attendance.view'])).toBe(false)
    expect(canOpenModule('materiales', ['apparel_orders.view'])).toBe(false)
    expect(visibleModules(['repairs.view']).map((m) => m.id)).toEqual(['canchas'])
  })
})
