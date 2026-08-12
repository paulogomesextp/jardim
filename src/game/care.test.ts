import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import { HORA_MS, horasDesdeUltimaRega, taxaAgua, taxaSaudeTotal, taxaSol, taxaVaso } from './care'

const especie: Especie = {
  id: 'teste',
  nome: 'Planta de Teste',
  categoria: 'flor',
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
    pragaTratadaEm: null,
    criadaEm: 0,
    ultimaAvaliacao: 0,
    ...overrides,
  }
}

describe('horasDesdeUltimaRega', () => {
  it('conta a partir da ultima rega quando existe', () => {
    const p = planta({ ultimaRega: 0 })
    expect(horasDesdeUltimaRega(p, 5 * HORA_MS)).toBe(5)
  })

  it('conta a partir da criacao quando nunca foi regada', () => {
    const p = planta({ ultimaRega: null, criadaEm: 2 * HORA_MS })
    expect(horasDesdeUltimaRega(p, 5 * HORA_MS)).toBe(3)
  })
})

describe('taxaAgua', () => {
  it('penaliza quando passou o intervalo ideal de rega', () => {
    const p = planta({ ultimaRega: 0 })
    const agora = (especie.regarCadaHoras + 1) * HORA_MS
    expect(taxaAgua(p, especie, agora)).toBe(-2)
  })

  it('recupera ligeiramente quando a rega esta em dia', () => {
    const p = planta({ ultimaRega: 0 })
    const agora = (especie.regarCadaHoras - 1) * HORA_MS
    expect(taxaAgua(p, especie, agora)).toBe(1)
  })
})

describe('taxaSol', () => {
  it('da bonus quando a exposicao e a ideal', () => {
    const p = planta({ posicaoSol: 'sol_pleno' })
    expect(taxaSol(p, especie)).toBe(0.5)
  })

  it('penaliza proporcionalmente a distancia da luz ideal', () => {
    const p = planta({ posicaoSol: 'sombra' })
    // sol_pleno -> sombra = 3 niveis de distancia
    expect(taxaSol(p, especie)).toBe(-3 * 1.5)
  })
})

describe('taxaVaso', () => {
  it('nao penaliza em semente/germinacao independentemente do tamanho', () => {
    const p = planta({ fase: 'semente', tamanhoVasoAtual: 1 })
    expect(taxaVaso(p, especie)).toBe(0)
  })

  it('nao penaliza quando o vaso ja atinge o minimo da fase', () => {
    const p = planta({ fase: 'jovem', tamanhoVasoAtual: 15 })
    expect(taxaVaso(p, especie)).toBe(0)
  })

  it('penaliza proporcionalmente quando o vaso e pequeno demais para a fase', () => {
    const p = planta({ fase: 'jovem', tamanhoVasoAtual: 10 })
    // minimo jovem = 15, diferenca = 5
    expect(taxaVaso(p, especie)).toBe(-5 * 0.5)
  })
})

describe('taxaSaudeTotal', () => {
  it('soma as tres taxas', () => {
    const p = planta({ posicaoSol: 'sol_pleno', tamanhoVasoAtual: 15, ultimaRega: 0 })
    const agora = (especie.regarCadaHoras - 1) * HORA_MS
    // agua (em dia) +1, sol (ideal) +0.5, vaso (ok) 0
    expect(taxaSaudeTotal(p, especie, agora)).toBeCloseTo(1.5)
  })
})
