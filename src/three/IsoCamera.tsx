import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'

// direcao isometrica classica (35.264 graus de inclinacao, 45 graus de yaw)
export const CAM_OFFSET = new THREE.Vector3(14, 14, 14)
const FOLLOW_SPEED = 6 // taxa de lerp exponencial, independente de framerate

interface Props {
  target: React.RefObject<THREE.Object3D | null>
}

/**
 * Camara ortografica de angulo fixo. A rotacao e calculada uma unica vez
 * (lookAt inicial) e nunca mais tocada -- so a posicao segue o avatar por
 * lerp. Assim o angulo nunca deriva, mesmo que o avatar alguma vez mude de
 * y (salto/ressalto), e e mais barato que recalcular lookAt todos os frames.
 */
export function IsoCamera({ target }: Props) {
  const camRef = useRef<THREE.OrthographicCamera>(null!)
  const orientado = useRef(false)

  useFrame((_, delta) => {
    const alvo = target.current
    const cam = camRef.current
    if (!alvo || !cam) return
    const desejada = alvo.position.clone().add(CAM_OFFSET)
    if (!orientado.current) {
      cam.position.copy(desejada)
      cam.lookAt(alvo.position)
      orientado.current = true
    } else {
      cam.position.lerp(desejada, 1 - Math.exp(-FOLLOW_SPEED * delta))
    }
  })

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      zoom={40}
      near={0.1}
      far={100}
      position={[CAM_OFFSET.x, CAM_OFFSET.y, CAM_OFFSET.z]}
    />
  )
}
