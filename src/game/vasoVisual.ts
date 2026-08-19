import type { TipoVaso } from '../db/schema'

/**
 * Catálogo de vasos disponíveis para o jogador escolher ao colocar um vaso
 * numa parcela vazia ou ao trocar de vaso numa planta já existente (ver
 * README "Colocação em fileiras", 2026-08-19). Cada tipo tem uma silhueta
 * CSS diferente (`garden.css`, `.vaso__corpo--<tipo>`); a cor é aplicada por
 * cima via `--vaso-cor` (custom property), não precisa de uma classe por
 * combinação tipo×cor.
 */
export const TIPOS_VASO: { id: TipoVaso; nome: string; precoBase: number }[] = [
  { id: 'barro', nome: 'Barro', precoBase: 10 },
  { id: 'ceramica', nome: 'Cerâmica', precoBase: 18 },
  { id: 'plastico', nome: 'Plástico', precoBase: 8 },
  { id: 'cesto', nome: 'Cesto de vime', precoBase: 22 },
]

export const CORES_VASO: { id: string; nome: string; valor: string }[] = [
  { id: 'terracota', nome: 'Terracota', valor: '#c1683f' },
  { id: 'creme', nome: 'Creme', valor: '#e8dcc0' },
  { id: 'verde', nome: 'Verde', valor: '#5c8a5a' },
  { id: 'azul', nome: 'Azul', valor: '#3f6fa0' },
  { id: 'lavanda', nome: 'Lavanda', valor: '#8f7fc2' },
  { id: 'preto', nome: 'Preto fosco', valor: '#3a3530' },
]

export const TIPO_VASO_PADRAO: TipoVaso = 'barro'
export const COR_VASO_PADRAO = CORES_VASO[0].valor

export function precoVaso(tipo: TipoVaso): number {
  return TIPOS_VASO.find((t) => t.id === tipo)?.precoBase ?? TIPOS_VASO[0].precoBase
}

export function nomeTipoVaso(tipo: TipoVaso): string {
  return TIPOS_VASO.find((t) => t.id === tipo)?.nome ?? tipo
}
