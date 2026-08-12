import type { PlantaComEspecie } from '../db/actions'

export interface LocalizacaoPlanta {
  id: number
  x: number
  z: number
  bed: 'rebentos' | 'crescimento'
}

export interface LimitesJardim {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const CELL = 1.8 // espaco entre vasos na grelha
const PATH_GAP = 3 // caminho entre os dois canteiros
const JITTER = CELL * 0.12 // pequeno desvio para nao parecer papel quadriculado

// PRNG determinístico seedado por id -- nunca Math.random(), para o layout ser estavel entre recargas
function mulberry32(seed: number) {
  let estado = seed | 0
  return function () {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jitterPara(id: number): { dx: number; dz: number } {
  const rand = mulberry32(id)
  return { dx: (rand() - 0.5) * 2 * JITTER, dz: (rand() - 0.5) * 2 * JITTER }
}

function profundidadeCanteiro(count: number): number {
  if (count === 0) return 0
  const colunas = Math.max(1, Math.ceil(Math.sqrt(count)))
  const linhas = Math.ceil(count / colunas)
  return (linhas - 1) * CELL
}

function organizarCanteiro(ids: number[], centroZ: number): Map<number, { x: number; z: number }> {
  const ordenados = [...ids].sort((a, b) => a - b)
  const colunas = Math.max(1, Math.ceil(Math.sqrt(ordenados.length)))
  const larguraTotal = (colunas - 1) * CELL
  const profundidadeTotal = profundidadeCanteiro(ordenados.length)
  const resultado = new Map<number, { x: number; z: number }>()
  ordenados.forEach((id, i) => {
    const col = i % colunas
    const linha = Math.floor(i / colunas)
    const baseX = -larguraTotal / 2 + col * CELL
    const baseZ = centroZ - profundidadeTotal / 2 + linha * CELL
    const { dx, dz } = jitterPara(id)
    resultado.set(id, { x: baseX + dx, z: baseZ + dz })
  })
  return resultado
}

/**
 * Posiciona as plantas em 2 canteiros deterministicos (sem alterar o schema
 * da BD, que nao tem campo de posicao): "rebentos" (semente/germinacao/
 * rebento) e "crescimento" (jovem/adulta) -- os mesmos buckets semanticos
 * que a antiga vista em carrossel ja usava. Dentro de cada canteiro,
 * ordena por id (estavel) e distribui numa grelha quadrada com um jitter
 * pequeno seedado por id, para nao parecer papel quadriculado.
 *
 * Aceite conscientemente: como o layout e funcao pura da fase atual, uma
 * planta que sobe de fase muda de canteiro no proximo recalculo -- raro
 * (horas entre fases) e nao vale a pena logica extra so para evitar isto.
 */
export function calcularLocalizacoes(plantas: PlantaComEspecie[]): LocalizacaoPlanta[] {
  const rebentos = plantas.filter(
    ({ planta }) => planta.fase === 'semente' || planta.fase === 'germinacao' || planta.fase === 'rebento',
  )
  const crescimento = plantas.filter(({ planta }) => planta.fase === 'jovem' || planta.fase === 'adulta')

  const profRebentos = profundidadeCanteiro(rebentos.length)
  const profCrescimento = profundidadeCanteiro(crescimento.length)

  const centroRebentos = -(PATH_GAP / 2 + profRebentos / 2)
  const centroCrescimento = PATH_GAP / 2 + profCrescimento / 2

  const posRebentos = organizarCanteiro(
    rebentos.map(({ planta }) => planta.id!),
    centroRebentos,
  )
  const posCrescimento = organizarCanteiro(
    crescimento.map(({ planta }) => planta.id!),
    centroCrescimento,
  )

  const resultado: LocalizacaoPlanta[] = []
  for (const { planta } of rebentos) {
    const pos = posRebentos.get(planta.id!)!
    resultado.push({ id: planta.id!, x: pos.x, z: pos.z, bed: 'rebentos' })
  }
  for (const { planta } of crescimento) {
    const pos = posCrescimento.get(planta.id!)!
    resultado.push({ id: planta.id!, x: pos.x, z: pos.z, bed: 'crescimento' })
  }
  return resultado
}

/** Retangulo que envolve todas as posicoes calculadas, com margem -- usado para dimensionar o chao e limitar o avatar. */
export function limitesJardim(localizacoes: LocalizacaoPlanta[], margem = 3): LimitesJardim {
  if (localizacoes.length === 0) return { minX: -margem, maxX: margem, minZ: -margem, maxZ: margem }
  const xs = localizacoes.map((l) => l.x)
  const zs = localizacoes.map((l) => l.z)
  return {
    minX: Math.min(...xs) - margem,
    maxX: Math.max(...xs) + margem,
    minZ: Math.min(...zs) - margem,
    maxZ: Math.max(...zs) + margem,
  }
}
