import type { Categoria } from '../db/schema'

/**
 * Forma da folhagem/fruto no jardim isométrico, por espécie (não só por
 * categoria como antes) -- pedido do Paulo para a arte da planta ser
 * "diferenciada conforme a planta". Cada combinação `folha`/`fruto` tem CSS
 * próprio em `garden.css` (`.vaso__folha--<folha>`, `.vaso__fruto--<fruto>`);
 * isto é só o mapeamento espécie -> forma + cor de destaque, continua sem
 * nenhuma imagem/asset novo (divs/clip-path, mesma filosofia do resto do
 * jardim DOM/CSS).
 */
export type FormaFolha = 'padrao' | 'agulha' | 'suculenta' | 'espiga'
export type FormaFruto = 'baga' | 'flor_estrela' | 'flor_grande' | 'flor_trombeta' | 'nenhum'

export interface FormaEspecie {
  folha: FormaFolha
  fruto: FormaFruto
  corAcento: string
}

const ACENTO_POR_CATEGORIA: Record<Categoria, string> = {
  fruta: '#e0421f',
  flor: '#c6baea',
  arbusto: '#b9e05a',
  vaso: '#7fae6e',
}

const FORMAS_POR_ESPECIE: Record<string, FormaEspecie> = {
  morangueiro: { folha: 'padrao', fruto: 'baga', corAcento: '#d81e3f' },
  tomate_cereja: { folha: 'padrao', fruto: 'baga', corAcento: '#e0421f' },
  alfazema: { folha: 'agulha', fruto: 'flor_estrela', corAcento: '#8f7fc2' },
  alecrim: { folha: 'agulha', fruto: 'nenhum', corAcento: '#5c8a5a' },
  manjericao: { folha: 'padrao', fruto: 'nenhum', corAcento: '#4f8a52' },
  suculenta: { folha: 'suculenta', fruto: 'nenhum', corAcento: '#7fae6e' },
  cacto: { folha: 'suculenta', fruto: 'flor_estrela', corAcento: '#e0568f' },
  petunia: { folha: 'padrao', fruto: 'flor_trombeta', corAcento: '#c65fae' },
  calendula: { folha: 'padrao', fruto: 'flor_grande', corAcento: '#f0a020' },
  girassol: { folha: 'espiga', fruto: 'flor_grande', corAcento: '#f5c518' },
}

/** Forma/cor de destaque para o jardim -- cai para uma forma padrão pela categoria se a espécie não tiver uma entrada dedicada (catálogo pode crescer). */
export function formaEspecie(speciesId: string | undefined, categoria: Categoria | undefined): FormaEspecie {
  if (speciesId && FORMAS_POR_ESPECIE[speciesId]) return FORMAS_POR_ESPECIE[speciesId]
  return { folha: 'padrao', fruto: 'baga', corAcento: ACENTO_POR_CATEGORIA[categoria ?? 'arbusto'] }
}

/** Mantido para quem só precisa da cor de destaque (ex: emblemas) sem a forma completa. */
export function acenteEspecie(categoria: Categoria | undefined): string {
  return ACENTO_POR_CATEGORIA[categoria ?? 'arbusto']
}
