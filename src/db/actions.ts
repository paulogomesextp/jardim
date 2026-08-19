import {
  db,
  type Especie,
  type Fase,
  type ItemLoja,
  type NivelLuz,
  type PlantaPossuida,
  type SementeInventario,
  type TipoVaso,
  type VasoPossuido,
} from './schema'
import { processarAoAbrir } from '../game/growth'
import { CHANCE_SUCESSO_TRATAMENTO_MANUAL, GRACA_MANUAL_HORAS, GRACA_REMEDIO_HORAS } from '../game/pragas'
import { precoVaso } from '../game/vasoVisual'

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

  const idsPlantas = await db.plantas.bulkAdd(plantas, { allKeys: true })
  const vasos: VasoPossuido[] = idsPlantas.map((plantaId, slotIndex) => ({
    slotIndex,
    tipo: 'barro',
    cor: '#c1683f',
    plantaId: plantaId as number,
  }))
  await db.vasos.bulkAdd(vasos)
}

/** Cria a planta em si (germinacao) -- uso interno, chamado depois de confirmar vaso vazio + inventario, ver `plantarNoVaso`. */
async function criarPlanta(speciesId: string): Promise<number> {
  const agora = Date.now()
  const nova: PlantaPossuida = {
    speciesId,
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
 * Planta uma semente do inventário (`SementeInventario`, ver `comprarSemente`/
 * `ganharSementeGratis`) num vaso já colocado e vazio -- nunca cria vaso
 * nem escolhe parcela sozinho (ver README "Colocação em fileiras",
 * 2026-08-19): o jogador tem sempre de colocar o vaso primeiro
 * (`colocarVasoNaParcela`).
 */
export async function plantarNoVaso(vasoId: number, speciesId: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const vaso = await db.vasos.get(vasoId)
  if (!vaso) return { ok: false, erro: 'Vaso não encontrado' }
  if (vaso.plantaId !== null) return { ok: false, erro: 'Este vaso já tem uma planta' }

  const inventario = await db.sementesInventario.where('speciesId').equals(speciesId).first()
  if (!inventario || inventario.quantidade < 1) return { ok: false, erro: 'Não tens sementes desta espécie' }

  const plantaId = await criarPlanta(speciesId)
  await db.vasos.update(vasoId, { plantaId })
  if (inventario.quantidade <= 1) await db.sementesInventario.delete(inventario.id!)
  else await db.sementesInventario.update(inventario.id!, { quantidade: inventario.quantidade - 1 })

  return { ok: true }
}

/** Coloca um vaso novo (vazio) numa parcela livre -- custo em moeda conforme o tipo escolhido (ver game/vasoVisual.ts). */
export async function colocarVasoNaParcela(
  slotIndex: number,
  tipo: TipoVaso,
  cor: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const existente = await db.vasos.where('slotIndex').equals(slotIndex).first()
  if (existente) return { ok: false, erro: 'Já há um vaso nesta parcela' }

  const custo = precoVaso(tipo)
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < custo) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - custo })
  await db.vasos.add({ slotIndex, tipo, cor, plantaId: null })
  return { ok: true }
}

export async function listarVasos(): Promise<VasoPossuido[]> {
  return db.vasos.toArray()
}

export async function listarInventarioSementes(): Promise<SementeInventario[]> {
  return db.sementesInventario.toArray()
}

async function adicionarAoInventario(speciesId: string, quantidade: number) {
  const existente = await db.sementesInventario.where('speciesId').equals(speciesId).first()
  if (existente) await db.sementesInventario.update(existente.id!, { quantidade: existente.quantidade + quantidade })
  else await db.sementesInventario.add({ speciesId, quantidade })
}

/** Chip "grátis, para testes" da loja -- entra no inventário como uma compra normal, não planta logo (mesma regra para todas as sementes). */
export async function ganharSementeGratis(speciesId: string) {
  await adicionarAoInventario(speciesId, 1)
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

/** Encontra o vaso físico onde uma planta está -- lookup por `plantaId`, tabela pequena (~dezenas de linhas), sem indice dedicado necessario. */
export async function obterVasoDaPlanta(plantaId: number): Promise<VasoPossuido | undefined> {
  return db.vasos.where('plantaId').equals(plantaId).first()
}

/**
 * Transplanta para um vaso maior (ou só troca o estilo), com custo em moeda
 * proporcional ao aumento de tamanho escolhido -- `novoTipo`/`novaCor` são
 * opcionais, para a mesma ação também servir de "trocar vaso" cosmético
 * (ver README "Colocação em fileiras", 2026-08-19) sem mexer na parcela onde
 * a planta já está.
 */
export async function transplantarVaso(
  id: number,
  incrementoCm: number,
  novoTipo?: TipoVaso,
  novaCor?: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const planta = await db.plantas.get(id)
  if (!planta) return { ok: false, erro: 'Planta nao encontrada' }
  const custo = custoTransplante(incrementoCm)
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < custo) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - custo })
  await db.plantas.update(id, { tamanhoVasoAtual: planta.tamanhoVasoAtual + incrementoCm })

  if (novoTipo || novaCor) {
    const vaso = await obterVasoDaPlanta(id)
    if (vaso) {
      const alteracoes: Partial<VasoPossuido> = {}
      if (novoTipo) alteracoes.tipo = novoTipo
      if (novaCor) alteracoes.cor = novaCor
      await db.vasos.update(vaso.id!, alteracoes)
    }
  }
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

/**
 * Compra uma semente da loja -- entra no inventário (`SementeInventario`),
 * NÃO planta logo (ver README "Colocação em fileiras", 2026-08-19): o
 * jogador escolhe depois um vaso vazio já colocado e planta a partir daí
 * (`plantarNoVaso`), em vez de a semente aparecer sozinha num sítio
 * aleatório do jardim.
 */
export async function comprarSemente(itemLojaId: number): Promise<{ ok: true } | { ok: false; erro: string }> {
  const item = await db.loja.get(itemLojaId)
  if (!item || item.tipo !== 'semente' || !item.speciesId) return { ok: false, erro: 'Item invalido' }
  const jogador = await db.jogador.get(1)
  if (!jogador || jogador.moeda < item.preco) return { ok: false, erro: 'Moeda insuficiente' }

  await db.jogador.update(1, { moeda: jogador.moeda - item.preco })
  await adicionarAoInventario(item.speciesId, 1)
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
  // o vaso fica no jardim, vazio -- so a planta desaparece (ver README "Colocacao em fileiras")
  const vaso = await obterVasoDaPlanta(plantaId)
  if (vaso) await db.vasos.update(vaso.id!, { plantaId: null })
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
