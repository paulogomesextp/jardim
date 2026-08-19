import { useEffect, useRef } from 'react'
import type { PlantaComEspecie } from '../db/actions'
import { mundoParaEcra } from './iso'
import { avatarPos, dispararAcaoAvatar } from './movement'

interface Props {
  x: number
  z: number
  item: PlantaComEspecie
  onRegar: () => void
  onCiclarSol: () => void
  onTratarPraga: () => void
  onVender: () => void
  onAbrirDetalhes: () => void
  onFechar: () => void
}

const OFFSET_TOPO_PX = 58 // sobe o balao para cima do vaso, mesmo espaco que o antigo margin-top
const MARGEM_ECRA_PX = 10 // nunca cola ao bordo do ecra
const LARGURA_ESTIMADA_PX = 190 // usada so antes da 1a medicao real (offsetWidth), ver calcularTransform
const ALTURA_ESTIMADA_PX = 90

/**
 * Calcula o `translate(...)` do balão em espaço de ecrã real, agarrado
 * (clamp) dentro da viewport -- mesma fórmula da câmara (`mundoParaEcra`/
 * `avatarPos`) aplicada ao ponto do vaso, ver comentário do componente.
 * `largura`/`altura` reais só existem depois do 1º render (via
 * `offsetWidth`/`offsetHeight`); antes disso usa uma estimativa, para o
 * balão já nascer no sítio certo sem esperar por um frame de
 * `requestAnimationFrame` (que fica suspenso sem a aba ter foco genuíno --
 * ver `Avatar.tsx`/README, o mesmo motivo por que o avatar em si também
 * calcula uma posição inicial síncrona em vez de depender só do rAF).
 */
function calcularTransform(x: number, z: number, largura: number, altura: number): string {
  const centroX = window.innerWidth / 2
  const centroY = window.innerHeight / 2
  const avatarEcra = mundoParaEcra(avatarPos.x, avatarPos.z)
  const alvoEcra = mundoParaEcra(x, z)
  let left = centroX - avatarEcra.left + alvoEcra.left
  let top = centroY - avatarEcra.top + alvoEcra.top - OFFSET_TOPO_PX

  left = Math.min(Math.max(left, largura / 2 + MARGEM_ECRA_PX), window.innerWidth - largura / 2 - MARGEM_ECRA_PX)
  top = Math.min(Math.max(top, altura + MARGEM_ECRA_PX), window.innerHeight - MARGEM_ECRA_PX)

  return `translate(${left}px, ${top}px) translate(-50%, -100%)`
}

/**
 * Balão de fala com ações rápidas, aparece por cima do vaso selecionado em
 * vez do painel antigo (`PlantActionSheet`, que ocupava o ecrã todo) --
 * pedido explícito do Paulo. Só as ações mais comuns vivem aqui (regar,
 * ciclar sol, tratar se houver praga, vender); tudo o resto (transplantar,
 * trocar de vaso, ver temporizadores) continua em "Detalhes", que abre o
 * `PlantActionSheet` de sempre por cima disto. Regar/tratar/vender disparam
 * também a animação do avatar (`dispararAcaoAvatar`, `movement.ts`) -- o
 * boneco "representa" a ação em vez de só a UI mudar por baixo.
 *
 * Renderizado por `GardenScene.tsx` FORA de `.mundo` de propósito -- é o
 * próprio componente que calcula a sua posição em espaço de ecrã real a
 * cada frame e a AGARRA (clamp) dentro da viewport, em vez de herdar a
 * transformação da câmara como o vaso -- isso permite manter-se sempre
 * visível mesmo para uma planta perto do bordo da grelha, onde a projeção
 * "crua" sairia fora do ecrã (ver README "Balão de fala nunca sai do
 * ecrã", 2026-08-19).
 */
export function PlantSpeechMenu({ x, z, item, onRegar, onCiclarSol, onTratarPraga, onVender, onAbrirDetalhes, onFechar }: Props) {
  const raizRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let idFrame: number
    function passo() {
      const raiz = raizRef.current
      if (raiz) {
        const largura = raiz.offsetWidth || LARGURA_ESTIMADA_PX
        const altura = raiz.offsetHeight || ALTURA_ESTIMADA_PX
        raiz.style.transform = calcularTransform(x, z, largura, altura)
      }
      idFrame = requestAnimationFrame(passo)
    }
    idFrame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(idFrame)
  }, [x, z])

  const viva = item.planta.estado !== 'morta'
  const nome = item.planta.nomeCustom || item.especieNome
  const transformInicial = calcularTransform(x, z, LARGURA_ESTIMADA_PX, ALTURA_ESTIMADA_PX)

  return (
    <div ref={raizRef} className="balao-raiz" style={{ transform: transformInicial }} onClick={(e) => e.stopPropagation()}>
      <div className="balao">
        <button className="balao__fechar" onClick={onFechar} aria-label="Fechar">
          ×
        </button>
        <div className="balao__nome">{nome}</div>
        <div className="balao__opcoes">
          {viva && (
            <>
              <button
                className="balao__opcao balao__opcao--regar"
                onClick={() => {
                  dispararAcaoAvatar('regar')
                  onRegar()
                }}
              >
                💧 Regar
              </button>
              <button
                className="balao__opcao balao__opcao--sol"
                onClick={() => {
                  dispararAcaoAvatar('sol')
                  onCiclarSol()
                }}
              >
                ☀️ Sol
              </button>
              {item.planta.estado === 'praga' && (
                <button
                  className="balao__opcao balao__opcao--praga"
                  onClick={() => {
                    dispararAcaoAvatar('tratar')
                    onTratarPraga()
                  }}
                >
                  🧪 Tratar
                </button>
              )}
              <button
                className="balao__opcao balao__opcao--vender"
                onClick={() => {
                  dispararAcaoAvatar('vender')
                  onVender()
                }}
              >
                💰 Vender
              </button>
            </>
          )}
          <button className="balao__opcao balao__opcao--detalhes" onClick={onAbrirDetalhes}>
            ⋯ Detalhes
          </button>
        </div>
      </div>
      <span className="balao__seta" aria-hidden="true" />
    </div>
  )
}
