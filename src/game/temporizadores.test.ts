import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import { HORA_MS } from './care'
import { formatarHoras, proximaFaseInfo, proximaRegaInfo } from './temporizadores'

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

describe('proximaRegaInfo', () => {
  it('mostra horas restantes quando ainda nao esta atrasada', () => {
    const p = planta({ ultimaRega: 0 })
    const r = proximaRegaInfo(p, especie, 10 * HORA_MS)
    expect(r.atrasado).toBe(false)
    expect(r.horas).toBeCloseTo(14)
  })

  it('mostra atraso quando ja passou o intervalo ideal', () => {
    const p = planta({ ultimaRega: 0 })
    const r = proximaRegaInfo(p, especie, 30 * HORA_MS)
    expect(r.atrasado).toBe(true)
    expect(r.horas).toBeCloseTo(6)
  })
})

describe('proximaFaseInfo', () => {
  it('mostra horas restantes para a proxima fase', () => {
    const p = planta({ fase: 'germinacao', dataInicioFase: 0 })
    const r = proximaFaseInfo(p, especie, 4 * HORA_MS)
    expect(r).not.toBeNull()
    expect(r!.atrasado).toBe(false)
    expect(r!.horas).toBeCloseTo(6)
  })

  it('devolve null quando ja esta na ultima fase (adulta)', () => {
    const p = planta({ fase: 'adulta', dataInicioFase: 0 })
    expect(proximaFaseInfo(p, especie, 100 * HORA_MS)).toBeNull()
  })
})

describe('formatarHoras', () => {
  it('mostra so horas quando menos de 24h', () => {
    expect(formatarHoras(5)).toBe('5h')
  })

  it('mostra dias e horas quando 24h ou mais', () => {
    expect(formatarHoras(30)).toBe('1d 6h')
  })

  it('mostra so dias quando exato', () => {
    expect(formatarHoras(48)).toBe('2d')
  })
})
