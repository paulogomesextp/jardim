/**
 * Mapeamento espécie -> modelo 3D real (Kenney "Nature Kit", CC0, ver
 * public/models/LICENSE.txt), um por espécie do catálogo para manter
 * alguma distinção visual entre elas mesmo sem foto. `altura` é a altura
 * real do modelo em unidades de mundo (bbox, ver script de inspeção
 * usado durante o desenvolvimento), usada para posicionar o nome por
 * cima sem ter de adivinhar.
 */
export interface ModeloPlanta {
  url: string
  altura: number
}

const BASE = `${import.meta.env.BASE_URL}models/plants/`

export const MODELOS_POR_ESPECIE: Record<string, ModeloPlanta> = {
  morangueiro: { url: `${BASE}morangueiro.glb`, altura: 0.2585 },
  tomate_cereja: { url: `${BASE}tomate_cereja.glb`, altura: 0.2925 },
  alfazema: { url: `${BASE}alfazema.glb`, altura: 0.3604 },
  suculenta: { url: `${BASE}suculenta.glb`, altura: 0.2351 },
  petunia: { url: `${BASE}petunia.glb`, altura: 0.2425 },
  calendula: { url: `${BASE}calendula.glb`, altura: 0.1925 },
  alecrim: { url: `${BASE}alecrim.glb`, altura: 0.2073 },
  cacto: { url: `${BASE}cacto.glb`, altura: 0.2843 },
  manjericao: { url: `${BASE}manjericao.glb`, altura: 0.2444 },
  girassol: { url: `${BASE}girassol.glb`, altura: 0.1585 },
}

// modelo generico para uma especie desconhecida (nao deve acontecer com o catalogo atual, so defensivo)
export const MODELO_GENERICO: ModeloPlanta = MODELOS_POR_ESPECIE.manjericao

export function modeloParaEspecie(speciesId: string): ModeloPlanta {
  return MODELOS_POR_ESPECIE[speciesId] ?? MODELO_GENERICO
}

export const TODOS_URLS_MODELOS = Object.values(MODELOS_POR_ESPECIE).map((m) => m.url)
