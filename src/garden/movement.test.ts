import { describe, expect, it } from 'vitest'
import { inputParaMundo } from './movement'
import { mundoParaEcra, profundidade } from './iso'

/**
 * Testa a convenção "joystick/teclado para cima empurra o avatar para cima
 * no ecrã" -- a parte que o comentário em `movement.ts` diz ter sido
 * "verificada ao vivo". Como a verificação visual ao vivo desta sessão
 * ficou bloqueada (browser automatizado sem a aba em primeiro plano
 * genuíno, ver README), este teste é a rede de segurança real: confirma a
 * direção pela matemática (que ponto de ecrã fica mais acima/à direita),
 * não por ter visto a animação.
 */
describe('inputParaMundo + mundoParaEcra (direção do joystick no ecrã)', () => {
  it('empurrar "para cima" (dz=-1) move para um ponto de ecrã mais alto (top menor)', () => {
    const { dx, dz } = inputParaMundo(0, -1)
    const antes = mundoParaEcra(0, 0)
    const depois = mundoParaEcra(dx, dz)
    expect(depois.top).toBeLessThan(antes.top)
  })

  it('empurrar "para baixo" (dz=1) move para um ponto de ecrã mais baixo (top maior)', () => {
    const { dx, dz } = inputParaMundo(0, 1)
    const antes = mundoParaEcra(0, 0)
    const depois = mundoParaEcra(dx, dz)
    expect(depois.top).toBeGreaterThan(antes.top)
  })

  it('empurrar "para a direita" (dx=1) move para um ponto de ecrã mais à direita (left maior)', () => {
    const { dx, dz } = inputParaMundo(1, 0)
    const antes = mundoParaEcra(0, 0)
    const depois = mundoParaEcra(dx, dz)
    expect(depois.left).toBeGreaterThan(antes.left)
  })

  it('empurrar "para a esquerda" (dx=-1) move para um ponto de ecrã mais à esquerda (left menor)', () => {
    const { dx, dz } = inputParaMundo(-1, 0)
    const antes = mundoParaEcra(0, 0)
    const depois = mundoParaEcra(dx, dz)
    expect(depois.left).toBeLessThan(antes.left)
  })

  it('empurrar "para cima" tambem reduz a profundidade (passa a desenhar-se atras de quem ficou parado)', () => {
    const { dx, dz } = inputParaMundo(0, -1)
    expect(profundidade(dx, dz)).toBeLessThan(profundidade(0, 0))
  })
})
