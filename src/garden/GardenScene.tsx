import { useEffect, useMemo, useRef, useState } from 'react'
import type { PlantaComEspecie } from '../db/actions'
import type { VasoPossuido } from '../db/schema'
import { gerarSlots, limitesJardim, slotsMinimosPara } from '../game/layout'
import { Avatar } from './Avatar'
import { PlantSprite } from './PlantSprite'
import { EmptySlotSprite } from './EmptySlotSprite'
import { PlantSpeechMenu } from './PlantSpeechMenu'
import { corEstadoVisual, emblemaEstado } from './estadoVisual'
import { formaEspecie } from './especieVisual'
import { avatarPos, ligarInputTeclado, moveTarget, RAIO_HISTERESE, RAIO_PROXIMIDADE } from './movement'
import { ecraParaMundo, mundoParaEcra } from './iso'
import './garden.css'

export interface AcoesRapidasPlanta {
  onRegar: (id: number) => void
  onCiclarSol: (id: number) => void
  onTratarPraga: (id: number) => void
  onVender: (id: number) => void
  onAbrirDetalhes: (id: number) => void
}

interface Props {
  plantas: PlantaComEspecie[]
  vasos: VasoPossuido[]
  selecionadaId: number | null
  onSelecionarPlanta: (id: number | null) => void
  onAbrirVasoVazio: (vasoId: number) => void
  onAbrirParcelaVazia: (slotIndex: number) => void
  acoes: AcoesRapidasPlanta
}

const INTERVALO_PROXIMIDADE_MS = 120 // ~8Hz, nao precisa de ser todos os frames

/**
 * Cena do jardim, 100% DOM/CSS. Orquestra: chão isométrico (grelha fixa de
 * parcelas, ver `game/layout.ts::gerarSlots` -- já não é um layout dinâmico
 * empacotado pelas plantas possuídas), avatar, vasos/parcelas, câmara que
 * segue o avatar, tap-to-move no chão e um indicador de proximidade (anel a
 * pulsar) -- a seleção real só acontece ao CLICAR num vaso/parcela, nunca
 * automaticamente por estar perto (ver README "Clicar para abrir",
 * 2026-08-19; antes disto, aproximar-se sozinho já abria o painel).
 */
export function GardenScene({ plantas, vasos, selecionadaId, onSelecionarPlanta, onAbrirVasoVazio, onAbrirParcelaVazia, acoes }: Props) {
  const mundoRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [pertoIndex, setPertoIndex] = useState<number | null>(null)
  const pertoRef = useRef<number | null>(null)

  const maiorSlotUsado = useMemo(() => vasos.reduce((max, v) => Math.max(max, v.slotIndex), -1), [vasos])
  const slots = useMemo(() => gerarSlots(slotsMinimosPara(maiorSlotUsado)), [maiorSlotUsado])
  const limites = useMemo(() => limitesJardim(slots, 4), [slots])
  const vasosPorSlot = useMemo(() => new Map(vasos.map((v) => [v.slotIndex, v])), [vasos])
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

  // proximidade: so controla o anel visual "perto" (histerese para nao piscar),
  // NUNCA abre nada sozinho -- so o clique (PlantSprite/EmptySlotSprite) abre.
  useEffect(() => {
    const intervalo = setInterval(() => {
      const pos = avatarPos

      if (pertoRef.current !== null) {
        const atual = slots.find((s) => s.index === pertoRef.current)
        if (atual) {
          const dist = Math.hypot(pos.x - atual.x, pos.z - atual.z)
          if (dist <= RAIO_HISTERESE) return
        }
        pertoRef.current = null
        setPertoIndex(null)
      }

      let maisProxima: { index: number; x: number; z: number } | null = null
      let menorDist = Infinity
      for (const s of slots) {
        const dist = Math.hypot(pos.x - s.x, pos.z - s.z)
        if (dist < menorDist) {
          menorDist = dist
          maisProxima = s
        }
      }
      if (maisProxima && menorDist <= RAIO_PROXIMIDADE) {
        pertoRef.current = maisProxima.index
        setPertoIndex(maisProxima.index)
      }
    }, INTERVALO_PROXIMIDADE_MS)
    return () => clearInterval(intervalo)
  }, [slots])

  // onClick (nao onPointerDown) de proposito -- tem de ser o mesmo tipo de
  // evento que o `e.stopPropagation()` dos sprites intercepta, senao um tap
  // num vaso/parcela tambem dispararia isto por baixo.
  function aoTocarChao(e: React.MouseEvent) {
    const centroX = window.innerWidth / 2
    const centroY = window.innerHeight / 2
    const avatarEcra = mundoParaEcra(avatarPos.x, avatarPos.z)
    const localLeft = e.clientX - (centroX - avatarEcra.left)
    const localTop = e.clientY - (centroY - avatarEcra.top)
    moveTarget.current = ecraParaMundo(localLeft, localTop)
    onSelecionarPlanta(null)
  }

  // chao: um retangulo (padrao CSS de losangos) cobrindo a bounding box iso das parcelas -- sempre >= grelha
  // minima (game/layout.ts), por isso enche o ecra mesmo com poucos vasos colocados (ver README "Mapa em
  // ecra inteiro", 2026-08-19 -- antes disto o chao dependia do numero de plantas possuidas e podia ficar
  // pequeno, sobrando ceu a volta e lendo como "mapa cortado" no telemovel).
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

        {slots.map((slot) => {
          const vaso = vasosPorSlot.get(slot.index)
          const perto = pertoIndex === slot.index

          if (!vaso) {
            return (
              <EmptySlotSprite
                key={`parcela-${slot.index}`}
                x={slot.x}
                z={slot.z}
                perto={perto}
                onClick={() => onAbrirParcelaVazia(slot.index)}
              />
            )
          }

          const item = vaso.plantaId !== null ? plantasPorId.get(vaso.plantaId) : undefined
          const agora = Date.now()
          const forma = formaEspecie(item?.especie?.id, item?.especie?.categoria)
          const estaSelecionada = item ? selecionadaId === item.planta.id : false

          return (
            <div key={`slot-${slot.index}`}>
              <PlantSprite
                x={slot.x}
                z={slot.z}
                tipoVaso={vaso.tipo}
                corVaso={vaso.cor}
                fase={item ? item.planta.fase : null}
                nome={item ? item.planta.nomeCustom || item.especieNome : 'Vaso vazio'}
                folha={forma.folha}
                fruto={forma.fruto}
                corFruto={forma.corAcento}
                corEstado={item ? corEstadoVisual(item.planta, item.especie, agora) : '#8a8071'}
                emblema={item ? emblemaEstado(item.planta, item.especie, agora) : null}
                morta={item?.planta.estado === 'morta'}
                selecionada={estaSelecionada}
                perto={perto}
                onClick={() => (item ? onSelecionarPlanta(item.planta.id!) : onAbrirVasoVazio(vaso.id!))}
              />
              {estaSelecionada && item && (
                <PlantSpeechMenu
                  x={slot.x}
                  z={slot.z}
                  item={item}
                  onRegar={() => acoes.onRegar(item.planta.id!)}
                  onCiclarSol={() => acoes.onCiclarSol(item.planta.id!)}
                  onTratarPraga={() => acoes.onTratarPraga(item.planta.id!)}
                  onVender={() => acoes.onVender(item.planta.id!)}
                  onAbrirDetalhes={() => acoes.onAbrirDetalhes(item.planta.id!)}
                  onFechar={() => onSelecionarPlanta(null)}
                />
              )}
            </div>
          )
        })}

        <Avatar limites={limites} />
      </div>
    </div>
  )
}
