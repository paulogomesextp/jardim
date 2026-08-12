import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { inputVector, moveTarget, VELOCIDADE_AVATAR } from './movement'
import { CAM_OFFSET } from './IsoCamera'
import { desmetalizar } from './materialFix'

const MODELO_AVATAR_URL = `${import.meta.env.BASE_URL}models/avatar.glb`
useGLTF.preload(MODELO_AVATAR_URL)

interface Props {
  limites: { minX: number; maxX: number; minZ: number; maxZ: number }
}

// yaw fixo da camara (ver IsoCamera) -- roda o input do teclado para que
// "cima" no ecra corresponda a "para longe da camara" no mundo, nao ao eixo Z bruto
const YAW_CAMARA = Math.atan2(CAM_OFFSET.x, CAM_OFFSET.z)

/** Modelo real (Kenney "Mini Characters", CC0, ver public/models/LICENSE.txt) -- troca idle/andar pelas animacoes embutidas no glb. */
function ModeloAvatar({ aAndar }: { aAndar: boolean }) {
  const modeloRef = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(MODELO_AVATAR_URL)
  const { actions } = useAnimations(animations, modeloRef)

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) desmetalizar(obj.material)
    })
  }, [scene])

  useEffect(() => {
    actions.idle?.reset().fadeIn(0.25).play()
  }, [actions])

  useEffect(() => {
    const acaoAndar = actions.walk
    const acaoParado = actions.idle
    if (!acaoAndar || !acaoParado) return
    if (aAndar) {
      acaoAndar.reset().fadeIn(0.2).play()
      acaoParado.fadeOut(0.2)
    } else {
      acaoParado.reset().fadeIn(0.2).play()
      acaoAndar.fadeOut(0.2)
    }
  }, [aAndar, actions])

  return <primitive ref={modeloRef} object={scene} scale={0.85} />
}

export const Avatar = forwardRef<THREE.Group, Props>(function Avatar({ limites }, ref) {
  const grupoRef = useRef<THREE.Group>(null!)
  const [aAndar, setAAndar] = useState(false)
  useImperativeHandle(ref, () => grupoRef.current)

  useFrame((_, delta) => {
    const grupo = grupoRef.current
    if (!grupo) return

    let andou = false

    // input do teclado/joystick tem prioridade sobre um alvo de clique em curso
    const teclado = new THREE.Vector3(inputVector.x, 0, inputVector.z)
    if (teclado.lengthSq() > 0.0001) {
      moveTarget.current = null
      teclado.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), YAW_CAMARA)
      grupo.position.addScaledVector(teclado, VELOCIDADE_AVATAR * delta)
      grupo.rotation.y = Math.atan2(teclado.x, teclado.z)
      andou = true
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
        andou = true
      }
    }

    grupo.position.x = THREE.MathUtils.clamp(grupo.position.x, limites.minX, limites.maxX)
    grupo.position.z = THREE.MathUtils.clamp(grupo.position.z, limites.minZ, limites.maxZ)

    // setState so dispara quando o valor booleano muda -- nao a cada frame
    if (andou !== aAndar) setAAndar(andou)
  })

  return (
    <group ref={grupoRef} position={[0, 0, 0]}>
      <ModeloAvatar aAndar={aAndar} />
    </group>
  )
})
