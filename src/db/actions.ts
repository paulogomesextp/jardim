import { db, type Especie, type Fase, type ItemLoja, type NivelLuz, type PlantaPossuida } from './schema'
import { processarAoAbrir } from '../game/growth'
import { CHANCE_SUCESSO_TRATAMENTO_MANUAL, GRACA_MANUAL_HORAS, GRACA_REMEDIO_HORAS } from '../game/pragas'

const HORA_MS = 3_600_000
const FASES_DEMO: Exclude<Fase, 'semente'>[] = ['germinacao', 'rebento', 'jovem', 'adulta']
const ORDEM_LUZ: NivelLuz[] = ['sombra', 'sombra_parcial', 'sol_parcial', 'sol_pleno']

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Devolve uma posicao de sol a 2+ niveis de distancia do ideal -- suficiente para o motor detetar oidio (ver game/pragas.ts). */
function luzQueCausaOidio(luzIdeal: NivelLuz): NivelLuz {
  const idx = ORDEM_LUZ.indexOf(luzIdeal)
  return ORDEM_LUZ[idx <= 1 ? ORDEM_LUZ.length - 1 : 0]
}

const TOTAL_DEMO = 50
const MIN_POR_FASE = 2 // garante que germinacao/rebento/jovem (Crescimento) tem sempre 2+ plantas cada
const PROBLEMAS_SEDE = 2
const PROBLEMAS_PRAGA = 2 // total 4 problemas, folga acima do minimo de 2 pedido para "Plantas com Doenças"

/**
 * Semeia o jardim com 50 plantas (espécie aleatória, com repetição --
 * só há 10 espécies no catálogo), distribuídas por fase de crescimento de
 * forma a garantir pelo menos `MIN_POR_FASE` em cada uma das 3 fases-chave
 * (germinação, rebento, jovem -- cobrem as 3 primeiras janelas da UI, "jovem"
 * cobre também "Plantas em Crescimento" com "adulta"), e pelo menos
 * `PROBLEMAS_SEDE + PROBLEMAS_PRAGA` plantas com um problema ativo (sede
 * ou praga), para "Plantas com Doenças" nunca ficar vazia. Só corre se o
 * jardim estiver vazio (primeira abertura de sempre), para não voltar a
 * encher o jardim de quem já estava a jogar.
 *
 * `estado`/`pragaAtual` NÃO são escolhidos à mão -- `processarTodasAsPlantas`
 * (chamado logo a seguir, ao abrir a app) recalcula-os sempre a partir das
 * condições reais (`avaliarPraga` em game/pragas.ts), por isso a "praga" é
 * criada tornando o sol da planta errado (2+ níveis do ideal -- dá oídio),
 * não escrevendo o campo diretamente; escrever `estado: 'praga'` aqui seria
 * ignorado no primeiro recálculo.
 *
 * Nota: como o motor de crescimento faz "catch-up" sempre que a app abre
 * (ver game/growth.ts), as fases aqui sorteadas vão continuar a avançar
 * sozinhas com o tempo real -- isto garante a distribuição só no momento
 * da sementeira, não é uma garantia permanente ao longo dos dias.
 */
export async function semearJardimDemo() {
  if ((await db.plantas.count()) > 0) return
  const especies = await db.especies.toArray()
  if (especies.length === 0) return

  const agora = Date.now()

  const fasesForcadas = FASES_DEMO.flatMap((fase) => Array(MIN_POR_FASE).fill(fase) as (typeof fase)[])
  const fasesRestantes = Array.from(
    { length: TOTAL_DEMO - fasesForcadas.length },
    () => FASES_DEMO[Math.floor(Math.random() * FASES_DEMO.length)],
  )
  const fasesFinais = embaralhar([...fasesForcadas, ...fasesRestantes])

  const indicesEmbaralhados = embaralhar(Array.from({ length: TOTAL_DEMO }, (_, i) => i))
  const indicesSede = new Set(indicesEmbaralhados.slice(0, PROBLEMAS_SEDE))
  const indicesPraga = new Set(indicesEmbaralhados.slice(PROBLEMAS_SEDE, PROBLEMAS_SEDE + PROBLEMAS_PRAGA))

  const plantas: PlantaPossuida[] = fasesFinais.map((fase, i) => {
    const especie = especies[Math.floor(Math.random() * especies.length)]
    const tamanhoVasoAtual = fase === 'germinacao' ? 8 : especie.tamanhoVasoMinimoPorFase[fase]
    const comSede = indicesSede.has(i)
    const comPraga = indicesPraga.has(i)

    return {
      speciesId: especie.id,
      fase,
      dataInicioFase: agora,
      // atrasada mas < 2x regarCadaHoras, para dar sede sem tambem disparar aranhico
      ultimaRega: comSede ? agora - (especie.regarCadaHoras + 6) * HORA_MS : agora,
      posicaoSol: comPraga ? luzQueCausaOidio(especie.luzIdeal) : especie.luzIdeal,
      tamanhoVasoAtual,
      saude: 100,
      estado: 'saudavel',
      pragaAtual: null,
      pragaImuneAte: null,
      criadaEm: agora,
      ultimaAvaliacao: agora,
    }
  })

  await db.plantas.bulkAdd(plantas)
}

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
  await db.jogador.update(1, {
    moeda: (jogador?.moeda ?? 0) + ganho,
    // conta para o "Nivel do Jardim" (game/nivel.ts) -- so soma em venda bem sucedida, nunca decresce
    totalColhidas: (jogador?.totalColhidas ?? 0) + 1,
  })
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
