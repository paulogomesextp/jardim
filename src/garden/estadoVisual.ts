import type { Especie, PlantaPossuida } from '../db/schema'
import { proximaRegaInfo } from '../game/temporizadores'

const COR_SAUDAVEL = '#3f7a5b'
const COR_STRESS = '#c1571f'
const COR_PRAGA = '#b23a2e'
const COR_MORTA = '#6b6152'
const COR_SEDE = '#2f8fd1'

/**
 * Cor/estado do indicador no vaso -- sem foto na cena (removida a pedido do
 * Paulo, "tire as fotos"), esta é a única forma de ler o estado da planta
 * a distância, por isso precisa de continuar a distinguir sede (rega
 * atrasada) mesmo não sendo um valor próprio de `Estado` -- perder-se-ia
 * esse sinal se só olhasse para `planta.estado`. Portado de
 * `three/estadoVisual.ts` sem alterações de lógica, só de localização
 * (agora usado por `PlantSprite.tsx`, DOM/CSS, não mais uma mesh 3D).
 */
export function corEstadoVisual(planta: PlantaPossuida, especie: Especie | undefined, agora: number): string {
  if (planta.estado === 'morta') return COR_MORTA
  if (planta.estado === 'praga') return COR_PRAGA
  if (planta.estado === 'stress') return COR_STRESS
  if (especie && proximaRegaInfo(planta, especie, agora).atrasado) return COR_SEDE
  return COR_SAUDAVEL
}

export type EmblemaEstado = 'sede' | 'praga' | 'stress' | 'pronta' | null

/** Que emblema (bolha de emoji) mostrar por cima do vaso -- prioriza problemas sobre o "pronta a colher" cosmético. */
export function emblemaEstado(planta: PlantaPossuida, especie: Especie | undefined, agora: number): EmblemaEstado {
  if (planta.estado === 'morta') return null
  if (planta.estado === 'praga') return 'praga'
  if (especie && proximaRegaInfo(planta, especie, agora).atrasado) return 'sede'
  if (planta.estado === 'stress') return 'stress'
  if (planta.fase === 'adulta') return 'pronta'
  return null
}
