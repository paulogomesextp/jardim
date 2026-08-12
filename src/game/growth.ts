import type { Especie, Estado, Fase, PlantaPossuida, TipoPraga } from '../db/schema'
import { ORDEM_FASES } from '../db/schema'
import { HORA_MS, taxaSaudeTotal } from './care'
import { avaliarPraga, taxaPraga } from './pragas'

export interface ResultadoProcessamento {
  saude: number
  estado: Estado
  pragaAtual: TipoPraga | null
  fase: Fase
  dataInicioFase: number
  ultimaAvaliacao: number
  subiuDeFase: boolean
}

function proximaFase(fase: Fase): Fase | null {
  const i = ORDEM_FASES.indexOf(fase)
  if (i === -1 || i === ORDEM_FASES.length - 1) return null
  return ORDEM_FASES[i + 1]
}

/**
 * Recalcula saude, estado e fase de uma planta a partir do tempo real
 * decorrido desde a ultima avaliacao ("catch-up" -- chamado sempre que a
 * app abre ou volta a primeiro plano, para a planta ter progredido mesmo
 * enquanto ninguem estava a ver, tal como no Travian/Ikariam).
 *
 * Simplificacao da v1: a fase so avanca se, ALEM do tempo da fase ter
 * passado, a saude no momento da avaliacao estiver > 0 (nao ficou
 * completamente negligenciada) -- nao guarda um historico continuo de
 * saude ao longo do intervalo, so o estado no fim. Suficiente para
 * validar o motor; pode ficar mais fino mais tarde se for preciso.
 */
export function processarAoAbrir(
  planta: PlantaPossuida,
  especie: Especie,
  agora: number = Date.now(),
): ResultadoProcessamento {
  if (planta.estado === 'morta') {
    return {
      saude: planta.saude,
      estado: 'morta',
      pragaAtual: planta.pragaAtual,
      fase: planta.fase,
      dataInicioFase: planta.dataInicioFase,
      ultimaAvaliacao: agora,
      subiuDeFase: false,
    }
  }

  const pragaAtual = avaliarPraga(planta, especie, agora)
  const horasDecorridas = Math.max(0, (agora - planta.ultimaAvaliacao) / HORA_MS)
  const taxa = taxaSaudeTotal(planta, especie, agora) + taxaPraga(pragaAtual)
  const novaSaude = clamp(planta.saude + taxa * horasDecorridas, 0, 100)
  const novoEstado: Estado =
    novaSaude <= 0 ? 'morta' : pragaAtual ? 'praga' : novaSaude < 50 ? 'stress' : 'saudavel'

  let fase = planta.fase
  let dataInicioFase = planta.dataInicioFase
  let subiuDeFase = false

  if (novoEstado !== 'morta') {
    const seguinte = proximaFase(fase)
    if (seguinte) {
      const duracaoFaseHoras =
        fase === 'semente' ? 0 : especie.duracaoFasesHoras[fase as Exclude<Fase, 'semente'>]
      const horasNaFaseAtual = (agora - dataInicioFase) / HORA_MS
      if (horasNaFaseAtual >= duracaoFaseHoras && novaSaude > 0) {
        fase = seguinte
        dataInicioFase = agora
        subiuDeFase = true
      }
    }
  }

  return {
    saude: novaSaude,
    estado: novoEstado,
    pragaAtual: novoEstado === 'morta' ? planta.pragaAtual : pragaAtual,
    fase,
    dataInicioFase,
    ultimaAvaliacao: agora,
    subiuDeFase,
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
