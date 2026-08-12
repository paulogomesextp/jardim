import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import { HORA_MS } from './care'
import { avaliarPraga, taxaPraga } from './pragas'

const especie: Especie = {
  id: 'teste',
  nome: 'Planta de Teste',
  categoria: 'flor',
  imagemUrl: '',
  luzIdeal: 'sol_pleno',
  regarCadaHoras: 24,
  humidadeIdealMin: 50,
  humidadeIdealMax: 60,
  duracaoFasesHoras: { germinacao: 10, rebento: 10, jovem: 10, adulta: 10 },
  tamanhoVasoMinimoPorFase: { germinacao: 5, rebento: 10, jovem: 15, adulta: 20 },
  valorVendaBase: 10,
}

function planta(overrides: Partial<PlantaPossuida> = {}): PlantaPossuida {
  return {
    speciesId: 'teste',
    fase: 'jovem',
    dataInicioFase: 0,
    ultimaRega: 0,
    posicaoSol: 'sol_pleno',
    tamanhoVasoAtual: 15,
    saude: 100,
    estado: 'saudavel',
    pragaAtual: null,
    pragaImuneAte: null,
    criadaEm: 0,
    ultimaAvaliacao: 0,
    ...overrides,
  }
}

describe('avaliarPraga', () => {
  it('nao ha praga quando os cuidados estao todos em dia', () => {
    const p = planta()
    expect(avaliarPraga(p, especie, 1 * HORA_MS)).toBeNull()
  })

  it('aranhico quando a rega esta 2x atrasada', () => {
    const p = planta({ ultimaRega: 0 })
    const agora = especie.regarCadaHoras * 2 * HORA_MS + HORA_MS
    expect(avaliarPraga(p, especie, agora)).toBe('aranhico')
  })

  it('oidio quando a posicao de sol esta 2+ niveis longe do ideal', () => {
    const p = planta({ posicaoSol: 'sombra_parcial' }) // sol_pleno -> sombra_parcial = 2 niveis
    expect(avaliarPraga(p, especie, 1 * HORA_MS)).toBe('oidio')
  })

  it('pulgao quando o vaso esta 5cm+ abaixo do minimo da fase', () => {
    const p = planta({ fase: 'jovem', tamanhoVasoAtual: 10 }) // minimo jovem = 15
    expect(avaliarPraga(p, especie, 1 * HORA_MS)).toBe('pulgao')
  })

  it('nunca ha pulgao em semente/germinacao independentemente do vaso', () => {
    const p = planta({ fase: 'germinacao', tamanhoVasoAtual: 1 })
    expect(avaliarPraga(p, especie, 1 * HORA_MS)).toBeNull()
  })

  it('fica imune enquanto agora < pragaImuneAte, mesmo que a causa continue verdadeira', () => {
    const p = planta({ ultimaRega: 0, pragaImuneAte: 100 * HORA_MS })
    const agora = 99 * HORA_MS // antes do fim da imunidade
    expect(avaliarPraga(p, especie, agora)).toBeNull()
  })

  it('volta a poder aparecer depois de pragaImuneAte passar, se a causa persistir', () => {
    const p = planta({ ultimaRega: 0, pragaImuneAte: 10 * HORA_MS })
    // depois do fim da imunidade (10h) E depois do limiar do aranhico (>48h sem rega)
    const agora = especie.regarCadaHoras * 2 * HORA_MS + HORA_MS
    expect(avaliarPraga(p, especie, agora)).toBe('aranhico')
  })
})

describe('taxaPraga', () => {
  it('sem penalizacao quando nao ha praga', () => {
    expect(taxaPraga(null)).toBe(0)
  })

  it('penaliza quando ha uma praga ativa', () => {
    expect(taxaPraga('oidio')).toBeLessThan(0)
  })
})
