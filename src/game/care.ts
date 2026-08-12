import type { Especie, Fase, NivelLuz, PlantaPossuida } from '../db/schema'

export const HORA_MS = 60 * 60 * 1000

const ORDEM_LUZ: NivelLuz[] = ['sombra', 'sombra_parcial', 'sol_parcial', 'sol_pleno']

/** Horas desde a ultima rega (ou desde que a planta foi criada, se nunca foi regada). */
export function horasDesdeUltimaRega(planta: PlantaPossuida, agora: number): number {
  const referencia = planta.ultimaRega ?? planta.criadaEm
  return (agora - referencia) / HORA_MS
}

/**
 * Taxa de variacao de saude (pontos por hora) devida a agua: penaliza
 * enquanto a planta estiver "com sede" (passou o intervalo ideal desde a
 * ultima rega); da um pequeno regenerar quando a rega esta em dia.
 */
export function taxaAgua(planta: PlantaPossuida, especie: Especie, agora: number): number {
  const atraso = horasDesdeUltimaRega(planta, agora) - especie.regarCadaHoras
  if (atraso > 0) return -2
  return 1
}

/** Taxa de saude devida a exposicao solar -- penaliza por cada "nivel" de distancia da luz ideal. */
export function taxaSol(planta: PlantaPossuida, especie: Especie): number {
  const distancia = Math.abs(ORDEM_LUZ.indexOf(planta.posicaoSol) - ORDEM_LUZ.indexOf(especie.luzIdeal))
  if (distancia === 0) return 0.5
  return -distancia * 1.5
}

/** Taxa de saude devida ao vaso -- raizes apertadas (vaso pequeno demais para a fase atual) custam saude aos poucos. */
export function taxaVaso(planta: PlantaPossuida, especie: Especie): number {
  if (planta.fase === 'semente' || planta.fase === 'germinacao') return 0
  const minimo = especie.tamanhoVasoMinimoPorFase[planta.fase as Exclude<Fase, 'semente'>]
  const diferenca = minimo - planta.tamanhoVasoAtual
  if (diferenca <= 0) return 0
  return -diferenca * 0.5
}

/** Soma das 3 taxas -- pontos de saude por hora, positivo ou negativo. */
export function taxaSaudeTotal(planta: PlantaPossuida, especie: Especie, agora: number): number {
  return taxaAgua(planta, especie, agora) + taxaSol(planta, especie) + taxaVaso(planta, especie)
}
