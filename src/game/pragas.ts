import type { Especie, PlantaPossuida, TipoPraga } from '../db/schema'
import { horasDesdeUltimaRega } from './care'

const ORDEM_LUZ = ['sombra', 'sombra_parcial', 'sol_parcial', 'sol_pleno'] as const

// diferenca entre tratamento manual (gratis) e remedio (pago) -- decisao
// tomada sem confirmar com o Paulo, a rever: manual tem hipotese de falhar
// e protege menos tempo; remedio e garantido e protege mais tempo, para a
// loja de remedios ter uma razao real de existir face a tratar de gratis.
export const CHANCE_SUCESSO_TRATAMENTO_MANUAL = 0.6
export const GRACA_MANUAL_HORAS = 3
export const GRACA_REMEDIO_HORAS = 12

/**
 * Cada praga e consequencia de UM erro de cuidado especifico, nao de saude
 * baixa em geral -- mapeamento provisorio, valores/associacoes a rever
 * com o Paulo:
 *  - aranhico (aranha-vermelha, prolifera em ambiente seco): rega muito
 *    atrasada (2x o intervalo ideal da especie)
 *  - oidio (fungo, favorecido por pouca luz/ventilacao): posicao de sol
 *    a 2+ niveis de distancia do ideal
 *  - pulgao (ataca plantas enfraquecidas por raizes apertadas): vaso 5cm+
 *    abaixo do minimo da fase atual
 * So pode existir uma praga de cada vez por planta (a primeira condicao
 * verdadeira, por esta ordem, e a que se aplica). Depois de tratada (manual
 * ou remedio), fica imune ate `pragaImuneAte` mesmo que a causa persista --
 * sem isto, tratar nao tinha qualquer efeito visivel quando a causa (ex:
 * posicao de sol) nao muda ao mesmo tempo.
 */
export function avaliarPraga(planta: PlantaPossuida, especie: Especie, agora: number): TipoPraga | null {
  if (planta.pragaImuneAte !== null && agora < planta.pragaImuneAte) {
    return null
  }

  if (horasDesdeUltimaRega(planta, agora) > especie.regarCadaHoras * 2) return 'aranhico'

  const distanciaSol = Math.abs(ORDEM_LUZ.indexOf(planta.posicaoSol) - ORDEM_LUZ.indexOf(especie.luzIdeal))
  if (distanciaSol >= 2) return 'oidio'

  if (planta.fase !== 'semente' && planta.fase !== 'germinacao') {
    const minimo = especie.tamanhoVasoMinimoPorFase[planta.fase]
    if (minimo - planta.tamanhoVasoAtual >= 5) return 'pulgao'
  }

  return null
}

/** Penalizacao extra de saude (pontos/hora) enquanto uma praga estiver ativa e por tratar. */
export function taxaPraga(pragaAtual: TipoPraga | null): number {
  return pragaAtual ? -3 : 0
}

export const NOMES_PRAGA: Record<TipoPraga, string> = {
  aranhico: 'Aranhiço',
  oidio: 'Oídio',
  pulgao: 'Pulgão',
}
