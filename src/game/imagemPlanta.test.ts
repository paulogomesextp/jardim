import { describe, expect, it } from 'vitest'
import type { Especie, PlantaPossuida } from '../db/schema'
import { HORA_MS } from './care'
import { IMAGEM_SEDE, IMAGENS_FASE_GENERICA, IMAGENS_REBENTO, escolherImagemPlanta } from './imagemPlanta'
import { IMAGENS_PRAGA } from './pragas'

const especie: Especie = {
  id: 'teste',
  nome: 'Planta de Teste',
  categoria: 'flor',
  imagemUrl: 'https://exemplo.org/planta-adulta.jpg',
  imagemJovemUrl: 'https://exemplo.org/planta-jovem.jpg',
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
    fase: 'adulta',
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

describe('escolherImagemPlanta', () => {
  it('fase adulta mostra a foto final (fruto/flor) da especie', () => {
    const p = planta({ fase: 'adulta' })
    expect(escolherImagemPlanta(p, especie, 1 * HORA_MS)).toEqual({
      url: especie.imagemUrl,
      motivo: null,
      rotulo: null,
    })
  })

  it('fase jovem mostra a foto jovem da especie, nao a final', () => {
    const p = planta({ fase: 'jovem' })
    const resultado = escolherImagemPlanta(p, especie, 1 * HORA_MS)
    expect(resultado.url).toBe(especie.imagemJovemUrl)
    expect(resultado.url).not.toBe(especie.imagemUrl)
  })

  it('fases semente/germinacao mostram fotos genericas partilhadas', () => {
    expect(escolherImagemPlanta(planta({ fase: 'semente' }), especie, 1 * HORA_MS).url).toBe(IMAGENS_FASE_GENERICA.semente)
    expect(escolherImagemPlanta(planta({ fase: 'germinacao' }), especie, 1 * HORA_MS).url).toBe(IMAGENS_FASE_GENERICA.germinacao)
  })

  it('fase rebento roda entre varias fotos genericas conforme o id da planta', () => {
    expect(escolherImagemPlanta(planta({ fase: 'rebento', id: 0 }), especie, 1 * HORA_MS).url).toBe(IMAGENS_REBENTO[0])
    expect(escolherImagemPlanta(planta({ fase: 'rebento', id: 1 }), especie, 1 * HORA_MS).url).toBe(IMAGENS_REBENTO[1])
    expect(escolherImagemPlanta(planta({ fase: 'rebento', id: IMAGENS_REBENTO.length }), especie, 1 * HORA_MS).url).toBe(IMAGENS_REBENTO[0])
  })

  it('mostra a foto de sede quando a rega esta atrasada, independentemente da fase', () => {
    const p = planta({ fase: 'jovem', ultimaRega: 0 })
    const agora = (especie.regarCadaHoras + 1) * HORA_MS
    const resultado = escolherImagemPlanta(p, especie, agora)
    expect(resultado.motivo).toBe('sede')
    expect(resultado.url).toBe(IMAGEM_SEDE)
  })

  it('mostra a foto da praga ativa, com prioridade sobre a sede', () => {
    const p = planta({ estado: 'praga', pragaAtual: 'oidio', ultimaRega: 0 })
    const agora = (especie.regarCadaHoras + 1) * HORA_MS // tambem atrasada, mas praga vem primeiro
    const resultado = escolherImagemPlanta(p, especie, agora)
    expect(resultado.motivo).toBe('praga')
    expect(resultado.url).toBe(IMAGENS_PRAGA.oidio)
  })

  it('nao mostra sintoma de sede numa planta morta -- mantem a foto da ultima fase', () => {
    const p = planta({ estado: 'morta', fase: 'adulta', ultimaRega: 0 })
    const agora = (especie.regarCadaHoras + 100) * HORA_MS
    expect(escolherImagemPlanta(p, especie, agora)).toEqual({
      url: especie.imagemUrl,
      motivo: null,
      rotulo: null,
    })
  })
})
