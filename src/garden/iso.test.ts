import { describe, expect, it } from 'vitest'
import { ecraParaMundo, mundoParaEcra, profundidade } from './iso'

describe('mundoParaEcra / ecraParaMundo (projeção isométrica)', () => {
  it('ecraParaMundo é o inverso exato de mundoParaEcra', () => {
    const pontos = [
      [0, 0],
      [3, 0],
      [0, 5],
      [-4, 2],
      [7.5, -3.25],
      [-10, -10],
    ]
    for (const [x, z] of pontos) {
      const ecra = mundoParaEcra(x, z)
      const voltaAoMundo = ecraParaMundo(ecra.left, ecra.top)
      expect(voltaAoMundo.x).toBeCloseTo(x, 9)
      expect(voltaAoMundo.z).toBeCloseTo(z, 9)
    }
  })

  it('x crescente move para a direita e para baixo no ecra (aresta iso classica)', () => {
    const a = mundoParaEcra(0, 0)
    const b = mundoParaEcra(1, 0)
    expect(b.left).toBeGreaterThan(a.left)
    expect(b.top).toBeGreaterThan(a.top)
  })

  it('profundidade cresce com x+z (mais perto da camara, desenha por cima)', () => {
    expect(profundidade(2, 3)).toBeGreaterThan(profundidade(1, 1))
  })
})
