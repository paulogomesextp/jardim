/**
 * Projeção isométrica 2:1 (a mesma proporção clássica de jogos iso 2D tipo
 * o FarmVille original -- losangos duas vezes mais largos que altos), pura
 * função de (x,z) do mundo -> pixels de ecrã. Substitui a câmara
 * ortográfica R3F/WebGL (ver `three/IsoCamera.tsx`, removido) por matemática
 * simples e síncrona: qualquer posição pode ser verificada lendo o
 * `style.transform` calculado, sem depender de um `<canvas>` ter sido
 * redimensionado (essa dependência foi a causa raiz do ecrã em branco no
 * telemóvel do Paulo em 2026-08-19, ver README).
 */

// tamanho de um "tile" em pixels, a escala de referência para 1 unidade de mundo
export const TILE_W = 64
export const TILE_H = 32

export interface PontoEcra {
  left: number
  top: number
}

/** Converte uma posição do mundo (x,z, mesmas unidades de `game/layout.ts`) em pixels de ecrã, relativos à origem do mundo. */
export function mundoParaEcra(x: number, z: number): PontoEcra {
  return {
    left: (x - z) * (TILE_W / 2),
    top: (x + z) * (TILE_H / 2),
  }
}

/** Profundidade para ordenar sobreposição (z-index): quem tem x+z maior está "mais perto" da câmara e desenha por cima. */
export function profundidade(x: number, z: number): number {
  return x + z
}

/** Inverso de `mundoParaEcra` -- usado para converter um tap/clique no chão de volta em coordenadas do mundo (tap-to-move). */
export function ecraParaMundo(left: number, top: number): { x: number; z: number } {
  const a = TILE_W / 2
  const b = TILE_H / 2
  const somaXZ = top / b // x + z
  const difXZ = left / a // x - z
  return {
    x: (somaXZ + difXZ) / 2,
    z: (somaXZ - difXZ) / 2,
  }
}
