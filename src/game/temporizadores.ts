import type { Especie, Fase, PlantaPossuida } from '../db/schema'
import { ORDEM_FASES } from '../db/schema'
import { HORA_MS, horasDesdeUltimaRega } from './care'

export interface InfoTemporizador {
  horas: number // horas ate ao evento (se atrasado, horas desde que devia ter acontecido)
  atrasado: boolean
}

/** Quanto falta (ou quanto passou) ate a proxima rega estar em atraso. */
export function proximaRegaInfo(planta: PlantaPossuida, especie: Especie, agora: number): InfoTemporizador {
  const decorridas = horasDesdeUltimaRega(planta, agora)
  const restantes = especie.regarCadaHoras - decorridas
  return { horas: Math.abs(restantes), atrasado: restantes < 0 }
}

function proximaFase(fase: Fase): Fase | null {
  const i = ORDEM_FASES.indexOf(fase)
  if (i === -1 || i === ORDEM_FASES.length - 1) return null
  return ORDEM_FASES[i + 1]
}

/** Quanto falta para a planta avancar de fase -- null se ja estiver na ultima fase (adulta). */
export function proximaFaseInfo(planta: PlantaPossuida, especie: Especie, agora: number): InfoTemporizador | null {
  if (proximaFase(planta.fase) === null) return null
  const duracaoHoras =
    planta.fase === 'semente' ? 0 : especie.duracaoFasesHoras[planta.fase as Exclude<Fase, 'semente'>]
  const decorridas = (agora - planta.dataInicioFase) / HORA_MS
  const restantes = duracaoHoras - decorridas
  return { horas: Math.abs(restantes), atrasado: restantes < 0 }
}

/** Formata horas para um texto curto: "3h", "1d 4h". */
export function formatarHoras(horas: number): string {
  const h = Math.round(horas)
  if (h < 24) return `${h}h`
  const dias = Math.floor(h / 24)
  const resto = h % 24
  return resto === 0 ? `${dias}d` : `${dias}d ${resto}h`
}
