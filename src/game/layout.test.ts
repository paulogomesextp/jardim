import { describe, expect, it } from 'vitest'
import type { PlantaComEspecie } from '../db/actions'
import type { Fase, PlantaPossuida } from '../db/schema'
import { calcularLocalizacoes, limitesJardim } from './layout'

function planta(id: number, fase: Fase): PlantaComEspecie {
  const p: PlantaPossuida = {
    id,
    speciesId: 'teste',
    fase,
    dataInicioFase: 0,
    ultimaRega: 0,
    posicaoSol: 'sol_pleno',
    tamanhoVasoAtual: 10,
    saude: 100,
    estado: 'saudavel',
    pragaAtual: null,
    pragaImuneAte: null,
    criadaEm: 0,
    ultimaAvaliacao: 0,
  }
  return { planta: p, especieNome: 'Teste', especie: undefined }
}

function distancia(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

describe('calcularLocalizacoes', () => {
  it('e deterministico -- mesma entrada produz sempre a mesma saida', () => {
    const plantas = [planta(3, 'jovem'), planta(1, 'rebento'), planta(2, 'adulta'), planta(5, 'semente')]
    const a = calcularLocalizacoes(plantas)
    const b = calcularLocalizacoes(plantas)
    expect(a).toEqual(b)
  })

  it('agrupa por fase nos 2 canteiros corretos', () => {
    const plantas = [planta(1, 'semente'), planta(2, 'germinacao'), planta(3, 'rebento'), planta(4, 'jovem'), planta(5, 'adulta')]
    const localizacoes = calcularLocalizacoes(plantas)
    const porId = new Map(localizacoes.map((l) => [l.id, l]))
    expect(porId.get(1)!.bed).toBe('rebentos')
    expect(porId.get(2)!.bed).toBe('rebentos')
    expect(porId.get(3)!.bed).toBe('rebentos')
    expect(porId.get(4)!.bed).toBe('crescimento')
    expect(porId.get(5)!.bed).toBe('crescimento')
  })

  it('nao sobrepoe plantas -- distancia minima razoavel entre quaisquer duas', () => {
    const plantas = Array.from({ length: 50 }, (_, i) => planta(i + 1, i % 2 === 0 ? 'jovem' : 'rebento'))
    const localizacoes = calcularLocalizacoes(plantas)
    let minDist = Infinity
    for (let i = 0; i < localizacoes.length; i++) {
      for (let j = i + 1; j < localizacoes.length; j++) {
        minDist = Math.min(minDist, distancia(localizacoes[i], localizacoes[j]))
      }
    }
    expect(minDist).toBeGreaterThan(1.0)
  })

  it('devolve uma localizacao por planta, sem duplicados nem perdas', () => {
    const plantas = Array.from({ length: 50 }, (_, i) => planta(i + 1, i % 3 === 0 ? 'rebento' : 'adulta'))
    const localizacoes = calcularLocalizacoes(plantas)
    expect(localizacoes).toHaveLength(50)
    expect(new Set(localizacoes.map((l) => l.id)).size).toBe(50)
  })

  it('lida com lista vazia sem rebentar', () => {
    expect(calcularLocalizacoes([])).toEqual([])
  })
})

describe('limitesJardim', () => {
  it('envolve todas as posicoes com a margem pedida', () => {
    const plantas = [planta(1, 'rebento'), planta(2, 'adulta')]
    const localizacoes = calcularLocalizacoes(plantas)
    const limites = limitesJardim(localizacoes, 3)
    for (const l of localizacoes) {
      expect(l.x).toBeGreaterThanOrEqual(limites.minX)
      expect(l.x).toBeLessThanOrEqual(limites.maxX)
      expect(l.z).toBeGreaterThanOrEqual(limites.minZ)
      expect(l.z).toBeLessThanOrEqual(limites.maxZ)
    }
  })

  it('devolve um retangulo minimo mesmo sem plantas', () => {
    const limites = limitesJardim([], 3)
    expect(limites).toEqual({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  })
})
