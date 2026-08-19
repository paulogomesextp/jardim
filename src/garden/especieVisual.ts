import type { Categoria } from '../db/schema'

/**
 * Cor de destaque (fruto/flor na fase adulta) por categoria -- reaproveita
 * a paleta já existente em `index.css` em vez de inventar cores novas por
 * espécie. Não tenta ser um retrato realista de cada planta (isso já
 * existe no cartão de detalhe 2D, com fotos reais) -- é só uma pista visual
 * rápida no jardim para distinguir "isto é uma fruta" de "isto é uma flor"
 * à distância, ao estilo dos ícones simplificados do FarmVille.
 */
const ACENTO_POR_CATEGORIA: Record<Categoria, string> = {
  fruta: 'var(--laranja)',
  flor: 'var(--lavanda)',
  arbusto: 'var(--lima)',
  vaso: 'var(--teal)',
}

export function acenteEspecie(categoria: Categoria | undefined): string {
  return ACENTO_POR_CATEGORIA[categoria ?? 'arbusto']
}
