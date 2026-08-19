/**
 * "Nível do Jardim" -- acrescentado na reformulação FarmVille (2026-08-19)
 * como o equivalente ao XP/nível do FarmVille original (ver README), sem
 * inventar um sistema de pontos separado: reaproveita `totalColhidas`
 * (Jogador, `db/schema.ts`), incrementado uma vez por venda bem sucedida
 * em `venderPlanta`. Lógica pura e testada, tal como o resto de `game/*.ts`.
 */

export const COLHEITAS_POR_NIVEL = 5

export interface InfoNivel {
  nivel: number
  /** quantas colheitas já feitas dentro do nível atual (0..COLHEITAS_POR_NIVEL-1) */
  progresso: number
  faltamParaProximo: number
}

export function calcularNivel(totalColhidas: number): InfoNivel {
  const total = Math.max(0, Math.floor(totalColhidas))
  const nivel = Math.floor(total / COLHEITAS_POR_NIVEL) + 1
  const progresso = total % COLHEITAS_POR_NIVEL
  return { nivel, progresso, faltamParaProximo: COLHEITAS_POR_NIVEL - progresso }
}
