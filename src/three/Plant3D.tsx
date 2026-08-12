import * as THREE from 'three'
import type { Fase, Estado } from '../db/schema'
import { useRemoteTexture } from './textureCache'

const FASE_ESCALA: Record<Fase, number> = {
  semente: 0.3,
  germinacao: 0.45,
  rebento: 0.65,
  jovem: 0.95,
  adulta: 1.3,
}

const COR_ESTADO: Record<Estado, string> = {
  saudavel: '#3f7a5b',
  stress: '#c1571f',
  praga: '#b23a2e',
  morta: '#6b6152',
}

// mesmo yaw fixo da IsoCamera -- a foto nunca precisa de <Billboard> dinamico
// porque a camara nunca roda, uma unica orientacao serve sempre
const ROTACAO_FOTO = new THREE.Euler(0, Math.PI / 4, 0)

interface Props {
  x: number
  z: number
  fase: Fase
  estado: Estado
  fotoUrl: string | null
  onClick?: (event: { stopPropagation: () => void }) => void
}

/** Vaso (geometria primitiva) + foto real da especie/fase/sintoma como plano sempre virado para a camara + indicador de estado. */
export function Plant3D({ x, z, fase, estado, fotoUrl, onClick }: Props) {
  const escala = FASE_ESCALA[fase]
  const alturaVaso = 0.3 * escala
  const raioVaso = 0.28 * escala
  const textura = useRemoteTexture(fotoUrl)
  const ladoFoto = 0.9 * escala

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <mesh position={[0, alturaVaso / 2, 0]} castShadow>
        <cylinderGeometry args={[raioVaso * 0.75, raioVaso, alturaVaso, 12]} />
        <meshStandardMaterial color="#b5651d" />
      </mesh>
      {textura ? (
        <mesh position={[0, alturaVaso + ladoFoto / 2, 0]} rotation={ROTACAO_FOTO}>
          <planeGeometry args={[ladoFoto, ladoFoto]} />
          <meshBasicMaterial map={textura} toneMapped={false} />
        </mesh>
      ) : (
        <mesh position={[0, alturaVaso + 0.4 * escala, 0]}>
          <sphereGeometry args={[0.35 * escala, 10, 8]} />
          <meshStandardMaterial color="#5b8c5a" />
        </mesh>
      )}
      <mesh position={[0, 0.02, raioVaso + 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color={COR_ESTADO[estado]} />
      </mesh>
    </group>
  )
}
