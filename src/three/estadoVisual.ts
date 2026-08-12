import type { Especie, PlantaPossuida } from '../db/schema'
import { proximaRegaInfo } from '../game/temporizadores'

const COR_SAUDAVEL = '#3f7a5b'
const COR_STRESS = '#c1571f'
const COR_PRAGA = '#b23a2e'
const COR_MORTA = '#6b6152'
const COR_SEDE = '#2f8fd1'

/**
 * Cor do indicador de estado no vaso -- sem foto (removida a pedido do
 * Paulo, "tire as fotos"), esta e a unica forma de ler o estado da planta
 * a distancia, por isso precisa de continuar a distinguir sede (rega
 * atrasada) mesmo nao sendo um valor proprio de `Estado` -- perderia-se
 * esse sinal se so olhasse para `planta.estado`.
 */
export function corEstadoVisual(planta: PlantaPossuida, especie: Especie | undefined, agora: number): string {
  if (planta.estado === 'morta') return COR_MORTA
  if (planta.estado === 'praga') return COR_PRAGA
  if (planta.estado === 'stress') return COR_STRESS
  if (especie && proximaRegaInfo(planta, especie, agora).atrasado) return COR_SEDE
  return COR_SAUDAVEL
}
