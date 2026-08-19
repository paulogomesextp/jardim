import { describe, expect, it } from 'vitest'
import { calcularNivel, XP_POR_NIVEL } from './nivel'

describe('calcularNivel', () => {
  it('comeca no nivel 1 com 0 xp', () => {
    expect(calcularNivel(0)).toEqual({ nivel: 1, progresso: 0, faltamParaProximo: XP_POR_NIVEL })
  })

  it('avanca de nivel exatamente a cada XP_POR_NIVEL pontos', () => {
    expect(calcularNivel(XP_POR_NIVEL)).toEqual({ nivel: 2, progresso: 0, faltamParaProximo: XP_POR_NIVEL })
    expect(calcularNivel(XP_POR_NIVEL * 2)).toEqual({ nivel: 3, progresso: 0, faltamParaProximo: XP_POR_NIVEL })
  })

  it('calcula progresso dentro do nivel atual', () => {
    expect(calcularNivel(3)).toEqual({ nivel: 1, progresso: 3, faltamParaProximo: XP_POR_NIVEL - 3 })
    expect(calcularNivel(XP_POR_NIVEL + 2)).toEqual({ nivel: 2, progresso: 2, faltamParaProximo: XP_POR_NIVEL - 2 })
  })

  it('nunca da nivel/valores negativos com input invalido', () => {
    expect(calcularNivel(-4)).toEqual({ nivel: 1, progresso: 0, faltamParaProximo: XP_POR_NIVEL })
  })
})
