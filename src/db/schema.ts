import Dexie, { type EntityTable } from 'dexie'

export type Categoria = 'fruta' | 'flor' | 'arbusto' | 'vaso'
export type NivelLuz = 'sol_pleno' | 'sol_parcial' | 'sombra_parcial' | 'sombra'
export type Fase = 'semente' | 'germinacao' | 'rebento' | 'jovem' | 'adulta'
export type Estado = 'saudavel' | 'stress' | 'praga' | 'morta'
export type TipoVaso = 'barro' | 'ceramica' | 'plastico' | 'cesto'

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
  // mantido so como estatistica ("colheitas") -- deixou de ser a base do nivel, ver `xp`.
  totalColhidas: number
  // XP acumulado (nunca decresce) -- base do "Nivel do Jardim" (game/nivel.ts), ganho por
  // tarefa (regar/colocar vaso/plantar/transplantar/tratar praga/vender, ver
  // db/actions.ts::ganharXp), nao so por venda como na 1a versao deste sistema (schema v3).
  xp: number
  // chaves de `game/nivel.ts::XP_ACOES` que o jogador ja fez pelo menos uma vez -- usado
  // pelo tutorial contextual (game/tutorial.ts) para so sugerir tarefas que ainda nao fez.
  acoesFeitas: string[]
  // ids de passos do tutorial (onboarding inicial + dicas contextuais, game/tutorial.ts)
  // ja mostrados -- persistido para nunca repetir a mesma dica depois de vista/fechada.
  tutorialVisto: string[]
}

export interface ItemLoja {
  id?: number
  tipo: 'semente' | 'remedio'
  speciesId?: string // presente quando tipo === 'semente'
  pragaAlvo?: TipoPraga // presente quando tipo === 'remedio'
  nome: string
  preco: number
}

// vaso fisico, colocado numa parcela fixa do jardim (game/layout.ts) --
// existe independentemente de ter planta la dentro (ver "Colocacao em
// fileiras", reformulacao 2026-08-19): comprar uma semente NAO planta
// logo, fica em SementeInventario ate o jogador escolher um vaso vazio.
export interface VasoPossuido {
  id?: number
  slotIndex: number // posicao fixa na grelha do jardim, indice em game/layout.ts::gerarSlots()
  tipo: TipoVaso
  cor: string // hex escolhido pelo jogador em CORES_VASO (game/vasoVisual.ts)
  plantaId: number | null // null = vaso vazio, por plantar
}

// sementes/mudas compradas mas ainda nao plantadas -- inventario simples
// por especie (sem stacking de qualidade/variedade), consumido ao plantar
// num vaso vazio (db/actions.ts::plantarNoVaso)
export interface SementeInventario {
  id?: number
  speciesId: string
  quantidade: number
}

export const db = new Dexie('jardim') as Dexie & {
  especies: EntityTable<Especie, 'id'>
  plantas: EntityTable<PlantaPossuida, 'id'>
  jogador: EntityTable<Jogador, 'id'>
  loja: EntityTable<ItemLoja, 'id'>
  vasos: EntityTable<VasoPossuido, 'id'>
  sementesInventario: EntityTable<SementeInventario, 'id'>
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

// v3 (colocacao em fileiras, 2026-08-19): jardim deixa de posicionar
// plantas automaticamente por fase -- cada planta vive agora num `VasoPossuido`
// numa parcela fixa (`slotIndex`). Quem ja tinha plantas antes desta versao
// ganha um vaso de barro/terracota (a mesma cor que o vaso generico ja
// tinha) por planta existente, em slots sequenciais 0..n-1, para nao perder
// progresso -- ver game/layout.ts para o tamanho da grelha (sempre >= slots
// existentes + folga).
db.version(3)
  .stores({
    especies: 'id, categoria',
    plantas: '++id, speciesId, fase, estado',
    jogador: 'id',
    loja: '++id, tipo, speciesId',
    vasos: '++id, slotIndex, plantaId',
    sementesInventario: '++id, speciesId',
  })
  .upgrade(async (tx) => {
    const plantasExistentes = await tx.table('plantas').toArray()
    let slot = 0
    for (const planta of plantasExistentes) {
      await tx.table('vasos').add({ slotIndex: slot, tipo: 'barro', cor: '#c1683f', plantaId: planta.id })
      slot++
    }
  })

// v4 (nivel por tarefa + tutorial, 2026-08-19): `xp` substitui `totalColhidas`
// como base do "Nivel do Jardim" (game/nivel.ts) -- quem ja jogava fica com
// o MESMO nivel que tinha (xp = totalColhidas * XP_ACOES.vender, a mesma
// equivalencia usada por game/nivel.ts, ja que antes so a venda dava
// progresso). `tutorialVisto` ja comeca com 'onboarding' para quem esta a
// ser migrado (por definicao ja tinha um jogador antes desta versao, ou
// seja ja jogava) -- nao faz sentido mostrar-lhe o tutorial de "boas-vindas"
// outra vez so por ter atualizado a versao da app.
db.version(4)
  .stores({
    especies: 'id, categoria',
    plantas: '++id, speciesId, fase, estado',
    jogador: 'id',
    loja: '++id, tipo, speciesId',
    vasos: '++id, slotIndex, plantaId',
    sementesInventario: '++id, speciesId',
  })
  .upgrade(async (tx) => {
    await tx
      .table('jogador')
      .toCollection()
      .modify((j: Jogador) => {
        if (j.xp === undefined) j.xp = (j.totalColhidas ?? 0) * 5
        if (j.acoesFeitas === undefined) j.acoesFeitas = []
        if (j.tutorialVisto === undefined) j.tutorialVisto = ['onboarding']
      })
  })
