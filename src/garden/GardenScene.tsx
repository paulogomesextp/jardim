import { useEffect, useMemo, useRef } from 'react'
import type { PlantaComEspecie } from '../db/actions'
import { calcularLocalizacoes, limitesJardim } from '../game/layout'
import { Avatar } from './Avatar'
import { PlantSprite } from './PlantSprite'
import { corEstadoVisual, emblemaEstado } from './estadoVisual'
import { acenteEspecie } from './especieVisual'
import { avatarPos, ligarInputTeclado, moveTarget, RAIO_HISTERESE, RAIO_PROXIMIDADE } from './movement'
import { ecraParaMundo, mundoParaEcra } from './iso'
import './garden.css'

interface Props {
  plantas: PlantaComEspecie[]
  selecionadaId: number | null
  onSelecionarPlanta: (id: number | null) => void
}

const INTERVALO_PROXIMIDADE_MS = 120 // ~8Hz, nao precisa de ser todos os frames

/**
 * Cena do jardim, 100% DOM/CSS -- substitui `three/Scene.tsx` (Canvas R3F).
 * Orquestra: chão isométrico, avatar, vasos, câmara que segue o avatar
 * (translada `.mundo` em vez de mover uma câmara 3D), tap-to-move no chão
 * e deteção de proximidade (auto-seleciona a planta mais próxima), tudo em
 * `requestAnimationFrame`/`setInterval` simples. Ver README para a decisão
 * de arquitetura (2D isométrico em vez de R3F/WebGL) e o motivo: o bug real
 * de ecrã em branco no telemóvel do Paulo em 2026-08-19 (canvas R3F preso a
 * 300x150 sem resize com a aba sem foco) não tem equivalente aqui -- um nó
 * DOM tem sempre dimensões reais, verificáveis de forma síncrona.
 */
export function GardenScene({ plantas, selecionadaId, onSelecionarPlanta }: Props) {
  const mundoRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const proximidadeAtual = useRef<number | null>(null)

  const localizacoes = useMemo(() => calcularLocalizacoes(plantas), [plantas])
  const limites = useMemo(() => limitesJardim(localizacoes, 4), [localizacoes])
  const plantasPorId = useMemo(() => new Map(plantas.map((p) => [p.planta.id!, p])), [plantas])

  // teclado (WASD/setas) -- liga uma unica vez, o joystick ja escreve diretamente em inputVector
  useEffect(() => ligarInputTeclado(), [])

  // camara: translada `.mundo` para manter o avatar centrado no ecra, a cada frame
  useEffect(() => {
    let idFrame: number
    function passo() {
      const mundo = mundoRef.current
      if (mundo) {
        const { left, top } = mundoParaEcra(avatarPos.x, avatarPos.z)
        const centroX = window.innerWidth / 2
        const centroY = window.innerHeight / 2
        mundo.style.transform = `translate(${centroX - left}px, ${centroY - top}px)`
      }
      idFrame = requestAnimationFrame(passo)
    }
    idFrame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(idFrame)
  }, [])

  // proximidade: mesma logica de histerese que o ProximityWatcher.tsx (R3F) tinha -- so a frequencia
  // (setInterval em vez de useFrame) e a fonte de posicao (avatarPos partilhado) mudaram
  useEffect(() => {
    const intervalo = setInterval(() => {
      const pos = avatarPos

      if (proximidadeAtual.current !== null) {
        const perto = localizacoes.find((l) => l.id === proximidadeAtual.current)
        if (perto) {
          const dist = Math.hypot(pos.x - perto.x, pos.z - perto.z)
          if (dist <= RAIO_HISTERESE) return
        }
        proximidadeAtual.current = null
        onSelecionarPlanta(null)
      }

      let maisProxima: { id: number; x: number; z: number } | null = null
      let menorDist = Infinity
      for (const loc of localizacoes) {
        const dist = Math.hypot(pos.x - loc.x, pos.z - loc.z)
        if (dist < menorDist) {
          menorDist = dist
          maisProxima = loc
        }
      }
      if (maisProxima && menorDist <= RAIO_PROXIMIDADE) {
        proximidadeAtual.current = maisProxima.id
        onSelecionarPlanta(maisProxima.id)
      }
    }, INTERVALO_PROXIMIDADE_MS)
    return () => clearInterval(intervalo)
  }, [localizacoes, onSelecionarPlanta])

  // onClick (nao onPointerDown) de proposito -- tem de ser o mesmo tipo de
  // evento que o `e.stopPropagation()` do PlantSprite intercepta, senao um
  // tap num vaso tambem dispararia isto por baixo (pointerdown acontece
  // antes de click, atravessaria mesmo com o stopPropagation do click).
  // Bug real apanhado em code review nesta sessao antes do commit.
  function aoTocarChao(e: React.MouseEvent) {
    const centroX = window.innerWidth / 2
    const centroY = window.innerHeight / 2
    const avatarEcra = mundoParaEcra(avatarPos.x, avatarPos.z)
    // inverte a mesma transformacao que .mundo tem aplicada, para obter as coordenadas locais do clique dentro de .mundo
    const localLeft = e.clientX - (centroX - avatarEcra.left)
    const localTop = e.clientY - (centroY - avatarEcra.top)
    moveTarget.current = ecraParaMundo(localLeft, localTop)
  }

  // chao: um retangulo (padrao CSS de losangos) cobrindo a bounding box iso das posicoes calculadas
  const cantosChao = [
    mundoParaEcra(limites.minX, limites.minZ),
    mundoParaEcra(limites.maxX, limites.minZ),
    mundoParaEcra(limites.minX, limites.maxZ),
    mundoParaEcra(limites.maxX, limites.maxZ),
  ]
  const chaoLeft = Math.min(...cantosChao.map((c) => c.left))
  const chaoTop = Math.min(...cantosChao.map((c) => c.top))
  const chaoLargura = Math.max(...cantosChao.map((c) => c.left)) - chaoLeft
  const chaoAltura = Math.max(...cantosChao.map((c) => c.top)) - chaoTop

  return (
    <div ref={shellRef} className="jardim-mundo-camada" onClick={aoTocarChao}>
      <div className="ceu-sol" aria-hidden="true" />
      <div className="ceu-nuvem ceu-nuvem--1" aria-hidden="true" />
      <div className="ceu-nuvem ceu-nuvem--2" aria-hidden="true" />
      <div ref={mundoRef} className="mundo">
        <div
          className="chao"
          style={{ left: chaoLeft, top: chaoTop, width: chaoLargura, height: chaoAltura }}
        />

        {localizacoes.map((loc) => {
          const item = plantasPorId.get(loc.id)
          if (!item) return null
          const agora = Date.now()
          return (
            <PlantSprite
              key={loc.id}
              x={loc.x}
              z={loc.z}
              fase={item.planta.fase}
              nome={item.planta.nomeCustom || item.especieNome}
              acento={acenteEspecie(item.especie?.categoria)}
              corEstado={corEstadoVisual(item.planta, item.especie, agora)}
              emblema={emblemaEstado(item.planta, item.especie, agora)}
              morta={item.planta.estado === 'morta'}
              selecionada={selecionadaId === loc.id}
              onClick={() => onSelecionarPlanta(loc.id)}
            />
          )
        })}

        <Avatar limites={limites} />
      </div>
    </div>
  )
}
