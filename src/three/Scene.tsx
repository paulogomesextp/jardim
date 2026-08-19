import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlantaComEspecie } from '../db/actions'
import { calcularLocalizacoes, limitesJardim } from '../game/layout'
import { corEstadoVisual } from './estadoVisual'
import { IsoCamera } from './IsoCamera'
import { Ground } from './Ground'
import { Avatar } from './Avatar'
import { Plant3D } from './Plant3D'
import { useKeyboardInput } from './movement'
import { ProximityWatcher } from './ProximityWatcher'

interface Props {
  plantas: PlantaComEspecie[]
  onSelecionarPlanta: (id: number | null) => void
}

function ConteudoCena({ plantas, onSelecionarPlanta }: Props) {
  const avatarRef = useRef<THREE.Group>(null!)
  useKeyboardInput()

  const localizacoes = useMemo(() => calcularLocalizacoes(plantas), [plantas])
  const limites = useMemo(() => limitesJardim(localizacoes, 4), [localizacoes])
  const largaoChao = Math.max(20, limites.maxX - limites.minX)
  const profundidadeChao = Math.max(20, limites.maxZ - limites.minZ)

  const plantasPorId = useMemo(() => new Map(plantas.map((p) => [p.planta.id!, p])), [plantas])

  return (
    <>
      {/* iluminacao "plana" estilo FarmVille -- mais luz ambiente/hemisferica
          e menos peso na direcional, para sombras suaves em vez de duras
          (mesmo PCFSoft de sempre, so menos contraste entre luz e sombra) */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#fdf3dd', '#8fae5c', 0.55]} />
      <directionalLight position={[8, 12, 6]} intensity={0.85} castShadow />
      <IsoCamera target={avatarRef} />
      <Ground largura={largaoChao} profundidade={profundidadeChao} />
      <Avatar ref={avatarRef} limites={limites} />
      <ProximityWatcher avatarRef={avatarRef} localizacoes={localizacoes} onProximidade={onSelecionarPlanta} />
      {localizacoes.map((loc) => {
        const item = plantasPorId.get(loc.id)
        if (!item) return null
        return (
          <Plant3D
            key={loc.id}
            x={loc.x}
            z={loc.z}
            fase={item.planta.fase}
            speciesId={item.planta.speciesId}
            nome={item.planta.nomeCustom || item.especieNome}
            corEstado={corEstadoVisual(item.planta, item.especie, Date.now())}
            onClick={(evento) => {
              evento.stopPropagation()
              onSelecionarPlanta(loc.id)
            }}
          />
        )
      })}
    </>
  )
}

/** Canvas R3F a preencher o ecra -- ver src/components/GardenView.tsx para o HUD/paineis 2D sobrepostos. */
export function Scene(props: Props) {
  return (
    <Canvas
      className="jardim-canvas"
      shadows
      camera={{ position: [14, 14, 14] }}
      onCreated={(state) => {
        if (import.meta.env.DEV) (window as unknown as { __r3f?: unknown }).__r3f = state
      }}
    >
      <ConteudoCena {...props} />
    </Canvas>
  )
}
