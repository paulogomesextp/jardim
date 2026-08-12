import { useEffect } from 'react'
import * as THREE from 'three'

/**
 * Estado de input partilhado, fora do React -- lido dentro de useFrame.
 * Nunca usar useState para isto: mudaria a cada frame e forcaria re-render
 * de toda a arvore React 60x/seg.
 */

// direcao do teclado/joystick, cada eixo em [-1, 1]
export const inputVector = { x: 0, z: 0 }

// destino de clique/tap-to-move; null quando o avatar nao esta a andar para um alvo
export const moveTarget: { current: THREE.Vector3 | null } = { current: null }

export const VELOCIDADE_AVATAR = 4.2 // unidades/seg
export const RAIO_PROXIMIDADE = 1.2
export const RAIO_HISTERESE = 1.8
export const DISTANCIA_APROXIMACAO = 1.0 // quanto o avatar para antes do centro da planta ao ser chamado por tap

const TECLAS_X: Record<string, number> = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 }
const TECLAS_Z: Record<string, number> = { KeyW: -1, ArrowUp: -1, KeyS: 1, ArrowDown: 1 }
const teclasPressionadas = new Set<string>()

function recalcularInputTeclado() {
  let x = 0
  let z = 0
  for (const codigo of teclasPressionadas) {
    if (codigo in TECLAS_X) x += TECLAS_X[codigo]
    if (codigo in TECLAS_Z) z += TECLAS_Z[codigo]
  }
  inputVector.x = Math.sign(x)
  inputVector.z = Math.sign(z)
}

/** WASD/setas -> inputVector, direto (sem passar por useState/render). */
export function useKeyboardInput() {
  useEffect(() => {
    function aoPressionar(e: KeyboardEvent) {
      if (!(e.code in TECLAS_X) && !(e.code in TECLAS_Z)) return
      teclasPressionadas.add(e.code)
      recalcularInputTeclado()
    }
    function aoLargar(e: KeyboardEvent) {
      teclasPressionadas.delete(e.code)
      recalcularInputTeclado()
    }
    window.addEventListener('keydown', aoPressionar)
    window.addEventListener('keyup', aoLargar)
    return () => {
      window.removeEventListener('keydown', aoPressionar)
      window.removeEventListener('keyup', aoLargar)
      teclasPressionadas.clear()
      inputVector.x = 0
      inputVector.z = 0
    }
  }, [])
}
