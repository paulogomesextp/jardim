import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import type { PlantaComEspecie } from '../db/actions'
import { HORA_MS } from './care'
import { detetarProblemas } from './notificacoes'

const especie: Especie = {
  id: 'teste',
  nome: 'Planta de Teste',
  categoria: 'flor',
  imagemUrl: '',
  imagemJovemUrl: '',
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
    id: 1,
    speciesId: 'teste',
    fase: 'jovem',
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

function item(overrides: Partial<PlantaPossuida> = {}): PlantaComEspecie {
  return { planta: planta(overrides), especieNome: 'Planta de Teste', especie }
}

describe('detetarProblemas', () => {
  it('sem problemas quando tudo em dia', () => {
    expect(detetarProblemas([item()], 1 * HORA_MS)).toEqual([])
  })

  it('deteta rega atrasada', () => {
    const problemas = detetarProblemas([item({ ultimaRega: 0 })], 30 * HORA_MS)
    expect(problemas).toHaveLength(1)
    expect(problemas[0].chave).toBe('1-rega')
  })

  it('deteta praga ativa', () => {
    const problemas = detetarProblemas([item({ estado: 'praga', pragaAtual: 'oidio' })], 1 * HORA_MS)
    expect(problemas).toHaveLength(1)
    expect(problemas[0].chave).toBe('1-praga')
  })

  it('ignora plantas mortas', () => {
    const problemas = detetarProblemas([item({ estado: 'morta', ultimaRega: 0 })], 100 * HORA_MS)
    expect(problemas).toEqual([])
  })

  it('ignora plantas sem especie resolvida', () => {
    const semEspecie: PlantaComEspecie = { planta: planta({ ultimaRega: 0 }), especieNome: 'X', especie: undefined }
    expect(detetarProblemas([semEspecie], 100 * HORA_MS)).toEqual([])
  })
})
