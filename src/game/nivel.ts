/**
 * "Nível do Jardim" -- XP acumulado ao longo de toda a vida do jogador
 * (`Jogador.xp`, `db/schema.ts`), ganho a fazer tarefas no jardim (regar,
 * colocar vaso, plantar, transplantar, tratar praga, vender -- ver
 * `XP_ACOES` e `db/actions.ts::ganharXp`), não só ao vender como na
 * primeira versão deste sistema (2026-08-19) -- pedido do Paulo para o
 * nível subir "à medida que vamos fazendo tarefas", não só na venda final.
 * Lógica pura e testada, tal como o resto de `game/*.ts`.
 */

export const XP_POR_NIVEL = 25

// pontos por tarefa -- vender continua a valer mais (era a única fonte de
// progresso antes), o resto são tarefas mais frequentes/pequenas.
// migração v4 do schema (db/schema.ts) preserva o nível de quem já jogava:
// xp = totalColhidas * XP_ACOES.vender, a mesma equivalência usada aqui.
export const XP_ACOES = {
  regar: 1,
  colocarVaso: 2,
  plantar: 3,
  transplantar: 2,
  tratarPraga: 3,
  vender: 5,
} as const

export interface InfoNivel {
  nivel: number
  /** XP já ganho dentro do nível atual (0..XP_POR_NIVEL-1) */
  progresso: number
  faltamParaProximo: number
}

export function calcularNivel(xpTotal: number): InfoNivel {
  const total = Math.max(0, Math.floor(xpTotal))
  const nivel = Math.floor(total / XP_POR_NIVEL) + 1
  const progresso = total % XP_POR_NIVEL
  return { nivel, progresso, faltamParaProximo: XP_POR_NIVEL - progresso }
}
