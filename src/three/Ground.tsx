import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { moveTarget } from './movement'

interface Props {
  largura: number
  profundidade: number
}

const BASE = `${import.meta.env.BASE_URL}textures/grass/`
// unidades de mundo por repeticao da textura -- controla o tamanho aparente da relva
const TAMANHO_LADRILHO = 1.6

let texturasCarregando = false
let texturasProntas: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture } | null = null
const ouvintes = new Set<() => void>()

function carregarTexturasRelva() {
  if (texturasCarregando || texturasProntas) return
  texturasCarregando = true
  const loader = new THREE.TextureLoader()

  Promise.all([
    new Promise<THREE.Texture>((resolve, reject) => loader.load(`${BASE}Grass001_1K-JPG_Color.jpg`, resolve, undefined, reject)),
    new Promise<THREE.Texture>((resolve, reject) => loader.load(`${BASE}Grass001_1K-JPG_NormalGL.jpg`, resolve, undefined, reject)),
    new Promise<THREE.Texture>((resolve, reject) => loader.load(`${BASE}Grass001_1K-JPG_Roughness.jpg`, resolve, undefined, reject)),
  ])
    .then(([map, normalMap, roughnessMap]) => {
      map.colorSpace = THREE.SRGBColorSpace
      for (const tex of [map, normalMap, roughnessMap]) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      }
      texturasProntas = { map, normalMap, roughnessMap }
      for (const ouvir of ouvintes) ouvir()
    })
    .catch((erro) => console.error('[Ground] falha ao carregar texturas de relva', erro))
}

/** Chao do jardim, com relva PBR real (ambientCG "Grass001", CC0, ver public/textures/LICENSE.txt) -- tambem o alvo do raycast para clique/tap-to-move. */
export function Ground({ largura, profundidade }: Props) {
  const planoRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!)

  useEffect(() => {
    carregarTexturasRelva()
    function aplicar() {
      const mat = materialRef.current
      if (!mat || !texturasProntas) return
      mat.map = texturasProntas.map
      mat.normalMap = texturasProntas.normalMap
      mat.roughnessMap = texturasProntas.roughnessMap
      mat.needsUpdate = true
    }
    aplicar()
    ouvintes.add(aplicar)
    return () => {
      ouvintes.delete(aplicar)
    }
  }, [])

  useEffect(() => {
    const mat = materialRef.current
    if (!mat?.map) return
    const repX = largura / TAMANHO_LADRILHO
    const repZ = profundidade / TAMANHO_LADRILHO
    for (const tex of [mat.map, mat.normalMap, mat.roughnessMap]) tex?.repeat.set(repX, repZ)
  }, [largura, profundidade])

  function aoClicar(evento: ThreeEvent<MouseEvent | PointerEvent>) {
    evento.stopPropagation()
    moveTarget.current = new THREE.Vector3(evento.point.x, 0, evento.point.z)
  }

  return (
    <mesh ref={planoRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={aoClicar} receiveShadow>
      <planeGeometry args={[largura, profundidade]} />
      {/* color multiplica a textura PBR -- puxa a relva para um verde mais
          vivo/saturado (missao FarmVille), mantendo o normal/roughness map real */}
      <meshStandardMaterial ref={materialRef} color="#b9e05a" />
    </mesh>
  )
}
