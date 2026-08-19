import { describe, expect, it } from 'vitest'
import { gerarSlots, limitesJardim, slotsMinimosPara } from './layout'

describe('gerarSlots', () => {
  it('e deterministico -- mesma entrada produz sempre a mesma saida', () => {
    expect(gerarSlots(64)).toEqual(gerarSlots(64))
  })

  it('devolve pelo menos os slots minimos, sem duplicados de indice', () => {
    const slots = gerarSlots()
    expect(slots.length).toBeGreaterThanOrEqual(64)
    expect(new Set(slots.map((s) => s.index)).size).toBe(slots.length)
  })

  it('indices sao sequenciais a partir de 0', () => {
    const slots = gerarSlots()
    slots.forEach((s, i) => expect(s.index).toBe(i))
  })

  it('cresce para cobrir um minimo pedido maior que a grelha base', () => {
    const slots = gerarSlots(200)
    expect(slots.length).toBeGreaterThanOrEqual(200)
  })

  it('nenhuma parcela se sobrepoe -- distancia minima igual ao espacamento da grelha', () => {
    const slots = gerarSlots(64)
    let minDist = Infinity
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const d = Math.hypot(slots[i].x - slots[j].x, slots[i].z - slots[j].z)
        minDist = Math.min(minDist, d)
      }
    }
    expect(minDist).toBeGreaterThan(2.0)
  })
})

describe('slotsMinimosPara', () => {
  it('nunca desce abaixo do minimo base', () => {
    expect(slotsMinimosPara(0)).toBeGreaterThanOrEqual(64)
  })

  it('cobre o maior indice ja usado', () => {
    expect(slotsMinimosPara(199)).toBeGreaterThanOrEqual(200)
  })
})

describe('limitesJardim', () => {
  it('envolve todas as parcelas com a margem pedida', () => {
    const slots = gerarSlots(64)
    const limites = limitesJardim(slots, 3)
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(limites.minX)
      expect(s.x).toBeLessThanOrEqual(limites.maxX)
      expect(s.z).toBeGreaterThanOrEqual(limites.minZ)
      expect(s.z).toBeLessThanOrEqual(limites.maxZ)
    }
  })

  it('devolve um retangulo minimo mesmo sem parcelas', () => {
    const limites = limitesJardim([], 3)
    expect(limites).toEqual({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  })
})
