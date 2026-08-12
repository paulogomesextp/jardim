import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
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

// vaso pequeno e estreito (semente/germinacao/rebento) vs largo (jovem/adulta,
// depois do "transplante" que ja existe no jogo) -- 2 modelos reais da Kenney
// "Nature Kit" (CC0, ver public/models/LICENSE.txt), nao so escala do mesmo
const MODELO_VASO_PEQUENO_URL = `${import.meta.env.BASE_URL}models/pot_small.glb`
const MODELO_VASO_GRANDE_URL = `${import.meta.env.BASE_URL}models/pot_large.glb`
useGLTF.preload(MODELO_VASO_PEQUENO_URL)
useGLTF.preload(MODELO_VASO_GRANDE_URL)

const VASO_POR_FASE: Record<Fase, { url: string; no: string; altura: number }> = {
  semente: { url: MODELO_VASO_PEQUENO_URL, no: 'pot_small', altura: 0.268 },
  germinacao: { url: MODELO_VASO_PEQUENO_URL, no: 'pot_small', altura: 0.268 },
  rebento: { url: MODELO_VASO_PEQUENO_URL, no: 'pot_small', altura: 0.268 },
  jovem: { url: MODELO_VASO_GRANDE_URL, no: 'pot_large', altura: 0.2 },
  adulta: { url: MODELO_VASO_GRANDE_URL, no: 'pot_large', altura: 0.2 },
}

interface Props {
  x: number
  z: number
  fase: Fase
  estado: Estado
  fotoUrl: string | null
  onClick?: (event: { stopPropagation: () => void }) => void
}

/** Vaso real (Kenney "Nature Kit", CC0) + foto real da especie/fase/sintoma como plano sempre virado para a camara + indicador de estado. */
export function Plant3D({ x, z, fase, estado, fotoUrl, onClick }: Props) {
  const escala = FASE_ESCALA[fase]
  const infoVaso = VASO_POR_FASE[fase]
  // useGLTF cacheia por url -- chamar para os 2 modelos e barato, so um resolve o vaso desta fase
  const { nodes: nosPequeno } = useGLTF(MODELO_VASO_PEQUENO_URL) as unknown as { nodes: Record<string, THREE.Mesh> }
  const { nodes: nosGrande } = useGLTF(MODELO_VASO_GRANDE_URL) as unknown as { nodes: Record<string, THREE.Mesh> }
  const vaso = (infoVaso.url === MODELO_VASO_PEQUENO_URL ? nosPequeno : nosGrande)[infoVaso.no]
  const alturaVaso = infoVaso.altura * escala
  const textura = useRemoteTexture(fotoUrl)
  const ladoFoto = 0.9 * escala

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      {vaso && (
        <mesh geometry={vaso.geometry} material={vaso.material} scale={escala} castShadow receiveShadow />
      )}
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
      <mesh position={[0, 0.02, 0.24 * escala]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color={COR_ESTADO[estado]} />
      </mesh>
    </group>
  )
}
