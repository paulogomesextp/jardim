import { db, type Especie, type ItemLoja, type NivelLuz, type PlantaPossuida } from './schema'
import { processarAoAbrir } from '../game/growth'
import { CHANCE_SUCESSO_TRATAMENTO_MANUAL, GRACA_MANUAL_HORAS, GRACA_REMEDIO_HORAS } from '../game/pragas'

export async function plantarSemente(speciesId: string): Promise<number> {
  const agora = Date.now()
  const nova: PlantaPossuida = {
    speciesId,
    // 'semente' fica reservado para uma futura fase de inventario (semente
    // comprada mas ainda nao plantada) -- ao plantar entra logo em germinacao
    fase: 'germinacao',
    dataInicioFase: agora,
    ultimaRega: null,
    posicaoSol: 'sol_parcial',
    tamanhoVasoAtual: 8,
    saude: 100,
    estado: 'saudavel',
    pragaAtual: null,
    pragaImuneAte: null,
    criadaEm: agora,
    ultimaAvaliacao: agora,
  }
  return db.plantas.add(nova) as Promise<number>
}

/**
 * Tenta tratar a praga a mao, de graca -- tem CHANCE_SUCESSO_TRATAMENTO_MANUAL
 * de funcionar; se resultar, fica imune por GRACA_MANUAL_HORAS (curta). Se
 * falhar, a praga mantem-se e nada muda -- para a loja de remedios ter
 * uma razao real de existir (remedio e sempre garantido, ver
 * comprarETratarComRemedio).
 */
export async function tratarPragaManual(id: number): Promise<{ ok: true; sucesso: boolean }> {
  const sucesso = Math.random() < CHANCE_SUCESSO_TRATAMENTO_MANUAL
  if (sucesso) {
    await db.plantas.update(id, { pragaAtual: null, pragaImuneAte: Date.now() + GRACA_MANUAL_HORAS * 3_600_000 })
  }
  return { ok: true, sucesso }
}

export async function regarPlanta(id: number) {
  await db.plantas.update(id, { ultimaRega: Date.now() })
}

export async function mudarPosicaoSol(id: number, posicao: NivelLuz) {
  await db.plantas.update(id, { posicaoSol: posicao })
}

const CUSTO_POR_CM_VASO = 2 // moedas por cm de aumento -- arbitrario, a rever

/** Tamanhos de vaso oferecidos no transplante (cm de aumento face ao atual). */
export const INCREMENTOS_VASO_CM = [5, 10, 15] as const

export function custoTransplante(incrementoCm: number): number {
  return incrementoCm * CUSTO_POR_CM_VASO
}

/** Transplanta para um vaso maior, com custo em moeda proporcional ao aumento escolhido. */
export async function transplantarVaso(
  id: number,
  incrementoCm: number,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const planta = await db.plantas.get(id)
  if (!planta) return { ok: false, erro: 'Planta nao encontrada' }
  const custo = custoTransplante(incrementoCm)
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < custo) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - custo })
  await db.plantas.update(id, { tamanhoVasoAtual: planta.tamanhoVasoAtual + incrementoCm })
  return { ok: true }
}

export async function obterJogador() {
  return db.jogador.get(1)
}

/** Corre o motor de crescimento sobre todas as plantas vivas e grava o resultado -- chamar sempre que a app abre/volta a primeiro plano. */
export async function processarTodasAsPlantas() {
  const agora = Date.now()
  const plantas = await db.plantas.toArray()
  const especies = await db.especies.toArray()
  const especiesPorId = new Map(especies.map((e) => [e.id, e]))

  for (const planta of plantas) {
    if (planta.estado === 'morta' || planta.id === undefined) continue
    const especie = especiesPorId.get(planta.speciesId)
    if (!especie) continue
    const resultado = processarAoAbrir(planta, especie, agora)
    await db.plantas.update(planta.id, {
      saude: resultado.saude,
      estado: resultado.estado,
      pragaAtual: resultado.pragaAtual,
      fase: resultado.fase,
      dataInicioFase: resultado.dataInicioFase,
      ultimaAvaliacao: resultado.ultimaAvaliacao,
    })
  }
}

/** Compra uma semente da loja e planta-a logo -- falha se nao houver moeda suficiente. */
export async function comprarEPlantarSemente(itemLojaId: number): Promise<{ ok: true } | { ok: false; erro: string }> {
  const item = await db.loja.get(itemLojaId)
  if (!item || item.tipo !== 'semente' || !item.speciesId) return { ok: false, erro: 'Item invalido' }
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < item.preco) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - item.preco })
  await plantarSemente(item.speciesId)
  return { ok: true }
}

/** Compra e aplica um remedio a uma planta -- so funciona se a planta tiver a praga que esse remedio trata. */
export async function comprarETratarComRemedio(
  itemLojaId: number,
  plantaId: number,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const item = await db.loja.get(itemLojaId)
  if (!item || item.tipo !== 'remedio' || !item.pragaAlvo) return { ok: false, erro: 'Item invalido' }
  const planta = await db.plantas.get(plantaId)
  if (!planta) return { ok: false, erro: 'Planta nao encontrada' }
  if (planta.pragaAtual !== item.pragaAlvo) return { ok: false, erro: 'Este remedio nao trata a praga desta planta' }
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < item.preco) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - item.preco })
  await db.plantas.update(plantaId, { pragaAtual: null, pragaImuneAte: Date.now() + GRACA_REMEDIO_HORAS * 3_600_000 })
  return { ok: true }
}

/**
 * Vende a planta -- definitivo, a planta desaparece. Valor = valorVendaBase
 * da especie, escalado pela saude atual (0-100%); plantas com praga por
 * tratar vendem a metade do valor (nao vendaveis se mortas).
 * Percentagens arbitrarias, a rever com o Paulo.
 */
export async function venderPlanta(plantaId: number): Promise<{ ok: true; ganho: number } | { ok: false; erro: string }> {
  const planta = await db.plantas.get(plantaId)
  if (!planta) return { ok: false, erro: 'Planta nao encontrada' }
  if (planta.estado === 'morta') return { ok: false, erro: 'Nao e possivel vender uma planta morta' }
  const especie = await db.especies.get(planta.speciesId)
  if (!especie) return { ok: false, erro: 'Especie desconhecida' }

  const multiplicadorPraga = planta.pragaAtual ? 0.5 : 1
  const ganho = Math.round(especie.valorVendaBase * (planta.saude / 100) * multiplicadorPraga)

  const jogador = await db.jogador.get(1)
  await db.jogador.update(1, { moeda: (jogador?.moeda ?? 0) + ganho })
  await db.plantas.delete(plantaId)
  return { ok: true, ganho }
}

export async function listarLoja(): Promise<ItemLoja[]> {
  return db.loja.toArray()
}

export interface PlantaComEspecie {
  planta: PlantaPossuida
  especieNome: string
  especie: Especie | undefined
}

export async function listarPlantasComEspecie(): Promise<PlantaComEspecie[]> {
  const plantas = await db.plantas.toArray()
  const especies = await db.especies.toArray()
  const especiesPorId = new Map(especies.map((e) => [e.id, e]))
  return plantas
    .filter((p) => p.id !== undefined)
    .map((planta) => ({
      planta,
      especieNome: especiesPorId.get(planta.speciesId)?.nome ?? planta.speciesId,
      especie: especiesPorId.get(planta.speciesId),
    }))
}
