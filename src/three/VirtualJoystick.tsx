import { useEffect, useRef, useState } from 'react'
import { inputVector } from './movement'

const RAIO_BASE = 46 // px
const RAIO_KNOB = 22 // px

/**
 * Joystick tatil custom (canto inferior esquerdo) -- escreve diretamente em
 * inputVector, mesma convencao do teclado (x/z em [-1,1], rodados pelo yaw
 * fixo da camara dentro de Avatar.tsx). So renderiza em dispositivos de
 * ponteiro grosseiro (touch) -- em desktop fica limpo, so teclado.
 * Confinado a uma zona DOM propria com o seu proprio setPointerCapture,
 * para nunca deixar o drag chegar ao canvas R3F por baixo (evita conflito
 * com o gesto de tap-para-selecionar planta).
 */
export function VirtualJoystick() {
  const [ecraTatil, setEcraTatil] = useState(false)
  const baseRef = useRef<HTMLDivElement>(null)
  const [knobPos, setKnobPos] = useState({ x: 0, z: 0 })
  const ativoPointerId = useRef<number | null>(null)

  useEffect(() => {
    setEcraTatil(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  if (!ecraTatil) return null

  function aoIniciar(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    ativoPointerId.current = e.pointerId
    atualizar(e.clientX, e.clientY)
  }

  function aoMover(e: React.PointerEvent) {
    if (ativoPointerId.current !== e.pointerId) return
    atualizar(e.clientX, e.clientY)
  }

  function aoLargar(e: React.PointerEvent) {
    if (ativoPointerId.current !== e.pointerId) return
    ativoPointerId.current = null
    inputVector.x = 0
    inputVector.z = 0
    setKnobPos({ x: 0, z: 0 })
  }

  function atualizar(clientX: number, clientY: number) {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const centroX = rect.left + rect.width / 2
    const centroY = rect.top + rect.height / 2
    let dx = clientX - centroX
    let dy = clientY - centroY
    const dist = Math.hypot(dx, dy)
    if (dist > RAIO_BASE) {
      dx = (dx / dist) * RAIO_BASE
      dy = (dy / dist) * RAIO_BASE
    }
    setKnobPos({ x: dx, z: dy })
    // eixo Y do ecra (para baixo e positivo) corresponde a "recuar" -- mesma convencao do teclado (S/ArrowDown = z:1)
    inputVector.x = dx / RAIO_BASE
    inputVector.z = dy / RAIO_BASE
  }

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={aoIniciar}
      onPointerMove={aoMover}
      onPointerUp={aoLargar}
      onPointerCancel={aoLargar}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knobPos.x}px, ${knobPos.z}px)` }} />
    </div>
  )
}

export { RAIO_BASE, RAIO_KNOB }
