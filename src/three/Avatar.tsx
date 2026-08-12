import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { inputVector, moveTarget, VELOCIDADE_AVATAR } from './movement'
import { CAM_OFFSET } from './IsoCamera'

interface Props {
  limites: { minX: number; maxX: number; minZ: number; maxZ: number }
}

// yaw fixo da camara (ver IsoCamera) -- roda o input do teclado para que
// "cima" no ecra corresponda a "para longe da camara" no mundo, nao ao eixo Z bruto
const YAW_CAMARA = Math.atan2(CAM_OFFSET.x, CAM_OFFSET.z)

export const Avatar = forwardRef<THREE.Group, Props>(function Avatar({ limites }, ref) {
  const grupoRef = useRef<THREE.Group>(null!)
  useImperativeHandle(ref, () => grupoRef.current)

  useFrame((_, delta) => {
    const grupo = grupoRef.current
    if (!grupo) return

    // input do teclado/joystick tem prioridade sobre um alvo de clique em curso
    const teclado = new THREE.Vector3(inputVector.x, 0, inputVector.z)
    if (teclado.lengthSq() > 0.0001) {
      moveTarget.current = null
      teclado.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), YAW_CAMARA)
      grupo.position.addScaledVector(teclado, VELOCIDADE_AVATAR * delta)
    } else if (moveTarget.current) {
      const alvo = moveTarget.current
      const direcao = new THREE.Vector3(alvo.x - grupo.position.x, 0, alvo.z - grupo.position.z)
      const distancia = direcao.length()
      if (distancia < 0.05) {
        moveTarget.current = null
      } else {
        direcao.normalize()
        const passo = Math.min(VELOCIDADE_AVATAR * delta, distancia)
        grupo.position.addScaledVector(direcao, passo)
        grupo.rotation.y = Math.atan2(direcao.x, direcao.z)
      }
    }

    grupo.position.x = THREE.MathUtils.clamp(grupo.position.x, limites.minX, limites.maxX)
    grupo.position.z = THREE.MathUtils.clamp(grupo.position.z, limites.minZ, limites.maxZ)

    if (teclado.lengthSq() > 0.0001) {
      grupo.rotation.y = Math.atan2(teclado.x, teclado.z)
    }
  })

  return (
    <group ref={grupoRef} position={[0, 0, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.7, 4, 8]} />
        <meshStandardMaterial color="#2c5741" />
      </mesh>
      <mesh position={[0, 0.6, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial color="#e2692f" />
      </mesh>
    </group>
  )
})
