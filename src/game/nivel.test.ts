import { describe, expect, it } from 'vitest'
import { calcularNivel } from './nivel'

describe('calcularNivel', () => {
  it('comeca no nivel 1 com 0 colheitas', () => {
    expect(calcularNivel(0)).toEqual({ nivel: 1, progresso: 0, faltamParaProximo: 5 })
  })

  it('avanca de nivel exatamente a cada 5 colheitas', () => {
    expect(calcularNivel(5)).toEqual({ nivel: 2, progresso: 0, faltamParaProximo: 5 })
    expect(calcularNivel(10)).toEqual({ nivel: 3, progresso: 0, faltamParaProximo: 5 })
  })

  it('calcula progresso dentro do nivel atual', () => {
    expect(calcularNivel(3)).toEqual({ nivel: 1, progresso: 3, faltamParaProximo: 2 })
    expect(calcularNivel(7)).toEqual({ nivel: 2, progresso: 2, faltamParaProximo: 3 })
  })

  it('nunca da nivel/valores negativos com input invalido', () => {
    expect(calcularNivel(-4)).toEqual({ nivel: 1, progresso: 0, faltamParaProximo: 5 })
  })
})
