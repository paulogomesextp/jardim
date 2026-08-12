import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import { HORA_MS } from './care'
import { processarAoAbrir } from './growth'

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
    fase: 'germinacao',
    dataInicioFase: 0,
    ultimaRega: 0,
    posicaoSol: 'sol_pleno',
    tamanhoVasoAtual: 20,
    saude: 100,
    estado: 'saudavel',
    pragaAtual: null,
    pragaImuneAte: null,
    criadaEm: 0,
    ultimaAvaliacao: 0,
    ...overrides,
  }
}

describe('processarAoAbrir', () => {
  it('planta morta mantem-se morta e nao recalcula nada', () => {
    const p = planta({ estado: 'morta', saude: 0, fase: 'jovem' })
    const r = processarAoAbrir(p, especie, 100 * HORA_MS)
    expect(r.estado).toBe('morta')
    expect(r.fase).toBe('jovem')
    expect(r.saude).toBe(0)
  })

  it('avanca de fase quando o tempo da fase passou e a saude ficou positiva', () => {
    // rega e sol em dia -> saude so sobe, tempo na fase (10h) e cumprido
    const p = planta({ fase: 'germinacao', dataInicioFase: 0, ultimaRega: 0 })
    const agora = 10 * HORA_MS
    const r = processarAoAbrir(p, especie, agora)
    expect(r.subiuDeFase).toBe(true)
    expect(r.fase).toBe('rebento')
    expect(r.dataInicioFase).toBe(agora)
  })

  it('nao avanca de fase antes do tempo minimo da fase', () => {
    const p = planta({ fase: 'germinacao', dataInicioFase: 0, ultimaRega: 0 })
    const agora = 5 * HORA_MS
    const r = processarAoAbrir(p, especie, agora)
    expect(r.subiuDeFase).toBe(false)
    expect(r.fase).toBe('germinacao')
  })

  it('nao avanca de fase na ultima fase (adulta)', () => {
    const p = planta({ fase: 'adulta', dataInicioFase: 0, ultimaRega: 0 })
    const agora = 100 * HORA_MS
    const r = processarAoAbrir(p, especie, agora)
    expect(r.subiuDeFase).toBe(false)
    expect(r.fase).toBe('adulta')
  })

  it('fica com estado stress quando a saude cai abaixo de 50', () => {
    // nunca regada, muito tempo sem agua -> taxa de agua negativa domina
    const p = planta({ saude: 60, ultimaRega: 0, posicaoSol: 'sol_pleno', tamanhoVasoAtual: 20, ultimaAvaliacao: 0 })
    const agora = 50 * HORA_MS
    const r = processarAoAbrir(p, especie, agora)
    expect(r.estado === 'stress' || r.estado === 'morta').toBe(true)
  })

  it('morre quando a saude chega a 0 ou menos', () => {
    const p = planta({ saude: 5, ultimaRega: 0, posicaoSol: 'sombra', tamanhoVasoAtual: 1, ultimaAvaliacao: 0 })
    const agora = 50 * HORA_MS
    const r = processarAoAbrir(p, especie, agora)
    expect(r.estado).toBe('morta')
    expect(r.saude).toBe(0)
  })
})
