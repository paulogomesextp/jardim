import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { moveTarget } from './movement'

interface Props {
  largura: number
  profundidade: number
}

/** Chao plano do jardim -- tambem o alvo do raycast para clique/tap-to-move. */
export function Ground({ largura, profundidade }: Props) {
  const planoRef = useRef<THREE.Mesh>(null!)

  function aoClicar(evento: ThreeEvent<MouseEvent | PointerEvent>) {
    evento.stopPropagation()
    moveTarget.current = new THREE.Vector3(evento.point.x, 0, evento.point.z)
  }

  return (
    <mesh ref={planoRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={aoClicar} receiveShadow>
      <planeGeometry args={[largura, profundidade]} />
      <meshStandardMaterial color="#c7de7c" />
    </mesh>
  )
}
