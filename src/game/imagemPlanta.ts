import type { Especie, Fase, PlantaPossuida } from '../db/schema'
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
 * tentar arranjar 10 fotos diferentes so para estas 2-3 fases muito
 * curtas. `rebento` tambem serve de reserva para `imagemJovemUrl` nas
 * especies onde nao se encontrou uma foto de planta jovem fiavel (ver
 * comentario em seedSpecies.ts).
 */
export const IMAGENS_FASE_GENERICA: Record<'semente' | 'germinacao' | 'rebento', string> = {
  semente: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Native_Plant_Nursery_%2853729725629%29.jpg/1280px-Native_Plant_Nursery_%2853729725629%29.jpg',
  germinacao:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Fleece_lined_greenhouse_potting_tray_and_seed_pots_-_Flickr_-_peganum.jpg/1280px-Fleece_lined_greenhouse_potting_tray_and_seed_pots_-_Flickr_-_peganum.jpg',
  rebento: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Plant_Nursery_Seedling%21_%2855027505770%29.jpg/1280px-Plant_Nursery_Seedling%21_%2855027505770%29.jpg',
}

export interface ImagemPlantaInfo {
  url: string
  motivo: 'sede' | 'praga' | null
  rotulo: string | null
}

/** Foto "normal" da planta na fase atual, sem considerar problemas (sede/praga). */
function imagemPorFase(fase: Fase, especie: Especie | undefined): string {
  if (fase === 'semente') return IMAGENS_FASE_GENERICA.semente
  if (fase === 'germinacao') return IMAGENS_FASE_GENERICA.germinacao
  if (fase === 'rebento') return IMAGENS_FASE_GENERICA.rebento
  if (fase === 'jovem') return especie?.imagemJovemUrl ?? IMAGENS_FASE_GENERICA.rebento
  return especie?.imagemUrl ?? IMAGENS_FASE_GENERICA.rebento // adulta -- foto final (fruto/flor)
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
  return { url: imagemPorFase(planta.fase, especie), motivo: null, rotulo: null }
}
