import type { Especie, PlantaPossuida } from '../db/schema'
import { IMAGENS_PRAGA } from './pragas'
import { proximaRegaInfo } from './temporizadores'

/**
 * Foto real (Wikimedia Commons) de folha murcha, usada como sintoma
 * generico de sede -- ver o comentario em IMAGENS_PRAGA sobre porque nao
 * ha uma foto por especie.
 */
export const IMAGEM_SEDE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Wilted_Papaya_Leave.jpg/1280px-Wilted_Papaya_Leave.jpg'

/**
 * Fotos genericas (nao por especie) para as fases iniciais -- uma semente
 * ou um tabuleiro de germinacao de qualquer planta parecem-se muito uns
 * com os outros na realidade, por isso nao vale a pena (nem e fiavel)
 * tentar arranjar 10 fotos diferentes so para estas 2 fases muito curtas.
 */
export const IMAGENS_FASE_GENERICA: Record<'semente' | 'germinacao', string> = {
  semente: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Native_Plant_Nursery_%2853729725629%29.jpg/1280px-Native_Plant_Nursery_%2853729725629%29.jpg',
  // a foto anterior (tenda de estufa com pano branco) foi trocada a pedido do
  // Paulo (2026-08-12, "elimine esta imagem horrivel") -- reutiliza uma foto
  // ja escolhida para "rebento" em vez de procurar uma nova
  germinacao: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sprouting_seeds.jpg/1280px-Sprouting_seeds.jpg',
}

/**
 * Fotos genericas para "rebento", todas escolhidas pelo Paulo no
 * levantamento de fotos de 2026-08-12. Varias plantas costumam estar
 * nesta fase ao mesmo tempo (ver janela "Rebentos Iniciais"), por isso
 * roda-se entre elas por `planta.id` (ver `imagemRebentoPara`) em vez de
 * mostrar sempre a mesma -- minimiza duplicados quando varias plantas
 * rebento aparecem lado a lado.
 */
export const IMAGENS_REBENTO: string[] = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Plant_Nursery_Seedling%21_%2855027505770%29.jpg/1280px-Plant_Nursery_Seedling%21_%2855027505770%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Rooted_cuttings_-_Flickr_-_peganum_%282%29.jpg/1280px-Rooted_cuttings_-_Flickr_-_peganum_%282%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sprouting_seeds.jpg/1280px-Sprouting_seeds.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Diospyros_kaki_seedlings_04.jpg/1280px-Diospyros_kaki_seedlings_04.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Camellia_sinensis_seedling3.jpg/1280px-Camellia_sinensis_seedling3.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/22/Seedlings_10.jpg',
]

function imagemRebentoPara(planta: PlantaPossuida): string {
  const indice = (planta.id ?? 0) % IMAGENS_REBENTO.length
  return IMAGENS_REBENTO[indice]
}

export interface ImagemPlantaInfo {
  url: string
  motivo: 'sede' | 'praga' | null
  rotulo: string | null
}

/** Foto "normal" da planta na fase atual, sem considerar problemas (sede/praga). */
function imagemPorFase(planta: PlantaPossuida, especie: Especie | undefined): string {
  const fase = planta.fase
  if (fase === 'semente') return IMAGENS_FASE_GENERICA.semente
  if (fase === 'germinacao') return IMAGENS_FASE_GENERICA.germinacao
  if (fase === 'rebento') return imagemRebentoPara(planta)
  if (fase === 'jovem') return especie?.imagemJovemUrl ?? imagemRebentoPara(planta)
  return especie?.imagemUrl ?? imagemRebentoPara(planta) // adulta -- foto final (fruto/flor)
}

/**
 * Escolhe que foto mostrar no carrossel: a da fase atual de crescimento
 * (semente -> germinacao -> rebento -> jovem -> foto final adulta), ou uma
 * foto real de sintoma quando a planta tem um problema ativo (praga tem
 * prioridade sobre sede, por ser o problema mais grave -- ambas tem
 * prioridade sobre a foto de fase, porque um problema ativo e mais
 * importante de mostrar do que o progresso normal de crescimento).
 */
export function escolherImagemPlanta(
  planta: PlantaPossuida,
  especie: Especie | undefined,
  agora: number,
): ImagemPlantaInfo {
  if (planta.estado === 'praga' && planta.pragaAtual) {
    return { url: IMAGENS_PRAGA[planta.pragaAtual], motivo: 'praga', rotulo: 'Sintoma de praga' }
  }
  if (especie && planta.estado !== 'morta' && proximaRegaInfo(planta, especie, agora).atrasado) {
    return { url: IMAGEM_SEDE, motivo: 'sede', rotulo: 'Sintoma de sede' }
  }
  return { url: imagemPorFase(planta, especie), motivo: null, rotulo: null }
}
