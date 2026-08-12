import Dexie, { type EntityTable } from 'dexie'

export type Categoria = 'fruta' | 'flor' | 'arbusto' | 'vaso'
export type NivelLuz = 'sol_pleno' | 'sol_parcial' | 'sombra_parcial' | 'sombra'
export type Fase = 'semente' | 'germinacao' | 'rebento' | 'jovem' | 'adulta'
export type Estado = 'saudavel' | 'stress' | 'morta'

// ordem das fases -- indice usado para saber "a fase seguinte"
export const ORDEM_FASES: Fase[] = ['semente', 'germinacao', 'rebento', 'jovem', 'adulta']

export interface Especie {
  id: string
  nome: string
  categoria: Categoria
  luzIdeal: NivelLuz
  regarCadaHoras: number
  humidadeIdealMin: number
  humidadeIdealMax: number
  // duracao de cada fase em horas de jogo (comprimido -- nao e tempo real da planta),
  // indices alinhados com ORDEM_FASES a partir de 'germinacao' (semente nao tem duracao propria)
  duracaoFasesHoras: Record<Exclude<Fase, 'semente'>, number>
  tamanhoVasoMinimoPorFase: Record<Exclude<Fase, 'semente'>, number> // cm
  valorVendaBase: number
}

export interface PlantaPossuida {
  id?: number
  speciesId: string
  nomeCustom?: string
  fase: Fase
  dataInicioFase: number // epoch ms
  ultimaRega: number | null
  posicaoSol: NivelLuz
  tamanhoVasoAtual: number // cm
  saude: number // 0-100
  estado: Estado
  criadaEm: number
  ultimaAvaliacao: number // epoch ms -- ultima vez que growth.ts calculou saude/fase, base do "catch-up"
}

export interface Jogador {
  id: number // sempre 1, jogo single-player local
  moeda: number
}

export interface ItemLoja {
  id?: number
  tipo: 'semente' | 'remedio'
  speciesId?: string // presente quando tipo === 'semente'
  nome: string
  preco: number
}

export const db = new Dexie('jardim') as Dexie & {
  especies: EntityTable<Especie, 'id'>
  plantas: EntityTable<PlantaPossuida, 'id'>
  jogador: EntityTable<Jogador, 'id'>
  loja: EntityTable<ItemLoja, 'id'>
}

db.version(1).stores({
  especies: 'id, categoria',
  plantas: '++id, speciesId, fase, estado',
  jogador: 'id',
  loja: '++id, tipo, speciesId',
})
