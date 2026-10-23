import { describe, expect, it } from 'vitest'
import { getDemoSteps } from '../src/lib/demo'

describe('demo flow', () => {
  it('returns a 4-step guided tour for product demonstration', () => {
    const steps = getDemoSteps()

    expect(steps).toHaveLength(4)
    expect(steps.map((step) => step.title)).toEqual([
      'Dashboard',
      'Opérations',
      'Budgets',
      'Récurrences',
    ])
  })
})
