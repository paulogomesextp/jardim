import { db, type NivelLuz, type PlantaPossuida } from './schema'
import { processarAoAbrir } from '../game/growth'

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
    criadaEm: agora,
    ultimaAvaliacao: agora,
  }
  return db.plantas.add(nova) as Promise<number>
}

export async function regarPlanta(id: number) {
  await db.plantas.update(id, { ultimaRega: Date.now() })
}

export async function mudarPosicaoSol(id: number, posicao: NivelLuz) {
  await db.plantas.update(id, { posicaoSol: posicao })
}

/** Botao simples de teste para a v1 -- o fluxo de transplante a serio fica para uma fase seguinte. */
export async function aumentarVaso(id: number) {
  const planta = await db.plantas.get(id)
  if (!planta) return
  await db.plantas.update(id, { tamanhoVasoAtual: planta.tamanhoVasoAtual + 5 })
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
      fase: resultado.fase,
      dataInicioFase: resultado.dataInicioFase,
      ultimaAvaliacao: resultado.ultimaAvaliacao,
    })
  }
}

export interface PlantaComEspecie {
  planta: PlantaPossuida
  especieNome: string
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
    }))
}
