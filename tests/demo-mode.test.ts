import { describe, expect, it } from 'vitest'
import { getModeOptions } from '../src/lib/demo'

describe('demo mode options', () => {
  it('exposes a real mode and a demo mode for presentation', () => {
    const modes = getModeOptions()

    expect(modes).toHaveLength(2)
    expect(modes.map((mode) => mode.value)).toEqual(['real', 'demo'])
    expect(modes[1].label).toBe('Démo')
  })
})
