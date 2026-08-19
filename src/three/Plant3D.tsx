import * as THREE from 'three'
import { useGLTF, Text, Outlines } from '@react-three/drei'
import type { Fase } from '../db/schema'
import { desmetalizar } from './materialFix'
import { usePotClayMaterial } from './potMaterial'
import { modeloParaEspecie } from './plantModels'
import { submeshesDoNo } from './gltfUtils'

const FASE_ESCALA: Record<Fase, number> = {
  semente: 0.3,
  germinacao: 0.45,
  rebento: 0.65,
  jovem: 0.95,
  adulta: 1.3,
}

// mesmo yaw fixo da IsoCamera -- nunca precisa de <Billboard> dinamico
// porque a camara nunca roda, uma unica orientacao serve sempre
const ROTACAO_FIXA = new THREE.Euler(0, Math.PI / 4, 0)

// contorno escuro em cada submesh (vaso e planta) -- a marca visual mais
// reconhecivel do FarmVille ("contornos a definir os objetos"). Usa o
// <Outlines> do drei (tecnica de casco invertido, ja incluido na
// dependencia @react-three/drei, sem shader novo escrito a mao): cria a
// sua propria mesh extra a partir da geometria do pai, nao mexe no
// material/geometria original -- aditivo, nao pode partir o que ja
// renderiza. thickness e em pixels de ecra (modo screenspace=false),
// nao em unidades de mundo, por isso fica igual em todas as fases apesar
// da escala variar.
const COR_CONTORNO = '#1f3d2c' // verde-900 da paleta, em vez de preto puro
const ESPESSURA_CONTORNO = 2.5

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
  speciesId: string
  nome: string
  corEstado: string
  onClick?: (event: { stopPropagation: () => void }) => void
}

/** Vaso + planta reais (Kenney "Nature Kit", CC0) + nome por cima + indicador de estado -- sem foto (removida a pedido do Paulo). */
export function Plant3D({ x, z, fase, speciesId, nome, corEstado, onClick }: Props) {
  const escala = FASE_ESCALA[fase]
  const infoVaso = VASO_POR_FASE[fase]
  // useGLTF cacheia por url -- chamar para os 2 modelos e barato, so um resolve o vaso desta fase
  const { nodes: nosVasoPequeno } = useGLTF(MODELO_VASO_PEQUENO_URL) as unknown as { nodes: Record<string, THREE.Object3D> }
  const { nodes: nosVasoGrande } = useGLTF(MODELO_VASO_GRANDE_URL) as unknown as { nodes: Record<string, THREE.Object3D> }
  const noVaso = (infoVaso.url === MODELO_VASO_PEQUENO_URL ? nosVasoPequeno : nosVasoGrande)[infoVaso.no]
  const submeshesVaso = submeshesDoNo(noVaso)
  const materialVaso = usePotClayMaterial()

  const modeloPlanta = modeloParaEspecie(speciesId)
  const { nodes: nosPlanta } = useGLTF(modeloPlanta.url) as unknown as { nodes: Record<string, THREE.Object3D> }
  const noPlantaChave = Object.keys(nosPlanta).find((k) => k !== 'tmpParent')
  const submeshesPlanta = submeshesDoNo(noPlantaChave ? nosPlanta[noPlantaChave] : undefined)
  for (const m of submeshesPlanta) desmetalizar(m.material)

  const escalaVaso = escala * 1.8
  const alturaVaso = infoVaso.altura * escalaVaso
  const escalaPlanta = escala * 2.2
  const alturaPlanta = modeloPlanta.altura * escalaPlanta
  const alturaNome = alturaVaso + alturaPlanta + 0.18

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <group scale={escalaVaso}>
        {submeshesVaso.map((m, i) => (
          <mesh key={i} geometry={m.geometry} material={materialVaso} castShadow receiveShadow>
            <Outlines thickness={ESPESSURA_CONTORNO} color={COR_CONTORNO} />
          </mesh>
        ))}
      </group>
      <group position={[0, alturaVaso, 0]} scale={escalaPlanta}>
        {submeshesPlanta.map((m, i) => (
          <mesh key={i} geometry={m.geometry} material={m.material} castShadow>
            <Outlines thickness={ESPESSURA_CONTORNO} color={COR_CONTORNO} />
          </mesh>
        ))}
      </group>
      <Text
        position={[0, alturaNome, 0]}
        rotation={ROTACAO_FIXA}
        fontSize={0.16}
        color="#1f3d2c"
        outlineWidth={0.01}
        outlineColor="#fbf6ea"
        anchorX="center"
        anchorY="bottom"
      >
        {nome}
      </Text>
      <mesh position={[0, 0.02, 0.24 * escalaVaso]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color={corEstado} />
      </mesh>
    </group>
  )
}
