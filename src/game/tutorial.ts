/**
 * Tutorial em 2 camadas, pedido do Paulo (2026-08-19): um onboarding
 * inicial (sequência fixa, mostrada uma vez após o primeiro login) e dicas
 * contextuais (mostradas quando fizer sentido, só sobre tarefas que o
 * jogador ainda não fez -- `Jogador.acoesFeitas`, ver `db/actions.ts::
 * ganharXp`). Lógica pura e testada; a apresentação vive em
 * `components/OnboardingOverlay.tsx`/`TutorialDica.tsx`.
 */

export interface PassoOnboarding {
  id: string
  emoji: string
  titulo: string
  texto: string
}

export const PASSOS_ONBOARDING: PassoOnboarding[] = [
  {
    id: 'boas-vindas',
    emoji: '🌿',
    titulo: 'Bem-vindo ao Between Leaves',
    texto: 'Um jardim para cuidares de plantas reais -- água, sol e vaso certos fazem-nas crescer de verdade.',
  },
  {
    id: 'mover',
    emoji: '🕹️',
    titulo: 'Anda pelo jardim',
    texto: 'Usa o joystick (ou WASD/setas no teclado) para andares até às tuas plantas.',
  },
  {
    id: 'abrir',
    emoji: '👆',
    titulo: 'Toca numa planta',
    texto: 'Toca num vaso para abrir um balão com ações rápidas: regar, sol, tratar e vender.',
  },
  {
    id: 'loja',
    emoji: '🛒',
    titulo: 'Loja',
    texto: 'O botão da Loja compra sementes -- vão para o teu inventário, não aparecem plantadas sozinhas.',
  },
  {
    id: 'plantar',
    emoji: '🪴',
    titulo: 'Vaso primeiro, semente depois',
    texto: 'Toca numa parcela de terra livre para colocares um vaso (escolhe tipo e cor); depois toca nesse vaso para plantares uma semente do inventário.',
  },
]

export interface DicaContextual {
  id: string
  emoji: string
  titulo: string
  texto: string
}

/** Estado do jogo relevante para decidir que dica mostrar -- calculado pelo GardenView a partir do que já tem carregado. */
export interface EstadoParaDicas {
  acoesFeitas: string[]
  temPlantaComPraga: boolean
  temPlantaAdulta: boolean
  temVasoVazio: boolean
  temParcelaLivre: boolean
  temSementeNoInventario: boolean
  moeda: number
}

interface DicaComCondicao extends DicaContextual {
  condicao: (estado: EstadoParaDicas) => boolean
}

const DICAS: DicaComCondicao[] = [
  {
    id: 'dica-vaso-vazio',
    emoji: '🌱',
    titulo: 'Tens um vaso à espera',
    texto: 'Já colocaste um vaso vazio -- toca nele para plantares uma semente do teu inventário.',
    condicao: (e) => e.temVasoVazio && e.temSementeNoInventario && !e.acoesFeitas.includes('plantar'),
  },
  {
    id: 'dica-colocar-vaso',
    emoji: '🪴',
    titulo: 'Tens sementes por plantar',
    texto: 'Toca numa parcela de terra livre para colocares lá um vaso -- depois plantas a semente a partir dele.',
    condicao: (e) => e.temSementeNoInventario && !e.temVasoVazio && e.temParcelaLivre && !e.acoesFeitas.includes('colocarVaso'),
  },
  {
    id: 'dica-praga',
    emoji: '🐛',
    titulo: 'Tens uma praga!',
    texto: 'Abre essa planta e usa "Tratar" -- é grátis mas pode falhar, ou compra um remédio garantido na Loja.',
    condicao: (e) => e.temPlantaComPraga && !e.acoesFeitas.includes('tratarPraga'),
  },
  {
    id: 'dica-vender',
    emoji: '✨',
    titulo: 'Planta pronta a colher!',
    texto: 'Uma das tuas plantas já está adulta -- abre-a e usa "Vender" para ganhares moedas.',
    condicao: (e) => e.temPlantaAdulta && !e.acoesFeitas.includes('vender'),
  },
  {
    id: 'dica-transplantar',
    emoji: '🪴',
    titulo: 'Vaso pequeno demais?',
    texto: 'Abre uma planta, vai a "Detalhes" e usa "Transplantar" -- também dá para trocar o tipo/cor do vaso.',
    condicao: (e) => !e.acoesFeitas.includes('transplantar') && e.moeda >= 10,
  },
]

/**
 * Devolve a próxima dica relevante a mostrar (a primeira cuja condição se
 * verifica e ainda não foi vista), ou `null` se nenhuma se aplica agora.
 * Mostra sempre no máximo 1 de cada vez -- decisão consciente para não
 * bombardear o jogador com várias dicas ao mesmo tempo.
 */
export function proximaDicaContextual(estado: EstadoParaDicas, tutorialVisto: string[]): DicaContextual | null {
  for (const dica of DICAS) {
    if (tutorialVisto.includes(dica.id)) continue
    if (dica.condicao(estado)) return dica
  }
  return null
}
