import Dexie, { type EntityTable } from 'dexie'

export type Categoria = 'fruta' | 'flor' | 'arbusto' | 'vaso'
export type NivelLuz = 'sol_pleno' | 'sol_parcial' | 'sombra_parcial' | 'sombra'
export type Fase = 'semente' | 'germinacao' | 'rebento' | 'jovem' | 'adulta'
export type Estado = 'saudavel' | 'stress' | 'praga' | 'morta'

// cada praga esta ligada a UM tipo de negligencia especifico (ver game/pragas.ts)
// -- decisao provisoria a rever com o Paulo: mapeamento real pode mudar.
export type TipoPraga = 'aranhico' | 'oidio' | 'pulgao'

// ordem das fases -- indice usado para saber "a fase seguinte"
export const ORDEM_FASES: Fase[] = ['semente', 'germinacao', 'rebento', 'jovem', 'adulta']

export interface Especie {
  id: string
  nome: string
  categoria: Categoria
  imagemUrl: string // foto da planta adulta/final (fruto ou flor) -- ver game/imagemPlanta.ts
  imagemJovemUrl: string // foto da fase jovem (folhosa, ainda sem fruto/flor)
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
  pragaAtual: TipoPraga | null
  pragaImuneAte: number | null // epoch ms -- ate quando a praga fica suprimida apos um tratamento (ver game/pragas.ts)
  criadaEm: number
  ultimaAvaliacao: number // epoch ms -- ultima vez que growth.ts calculou saude/fase, base do "catch-up"
}

export interface Jogador {
  id: number // sempre 1, jogo single-player local
  moeda: number
  // total de plantas vendidas/colhidas ao longo de toda a vida do jogador -- nunca decresce,
  // base do "Nivel do Jardim" (ver game/nivel.ts), acrescentado na reformulacao FarmVille
  // (2026-08-19) para dar a sensacao de progressao/XP que o FarmVille original tinha.
  totalColhidas: number
}

export interface ItemLoja {
  id?: number
  tipo: 'semente' | 'remedio'
  speciesId?: string // presente quando tipo === 'semente'
  pragaAlvo?: TipoPraga // presente quando tipo === 'remedio'
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

// v2 (reformulacao FarmVille, 2026-08-19): acrescenta `totalColhidas` ao
// Jogador para o "Nivel do Jardim" -- indices das tabelas nao mudam, so o
// upgrade preenche o campo novo em quem ja tinha um registo de jogador.
db.version(2)
  .stores({
    especies: 'id, categoria',
    plantas: '++id, speciesId, fase, estado',
    jogador: 'id',
    loja: '++id, tipo, speciesId',
  })
  .upgrade(async (tx) => {
    await tx
      .table('jogador')
      .toCollection()
      .modify((j: Jogador) => {
        if (j.totalColhidas === undefined) j.totalColhidas = 0
      })
  })
