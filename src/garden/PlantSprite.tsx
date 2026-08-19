import type { Fase } from '../db/schema'
import type { EmblemaEstado } from './estadoVisual'
import { mundoParaEcra, profundidade } from './iso'

interface Props {
  x: number
  z: number
  fase: Fase
  nome: string
  acento: string
  corEstado: string
  emblema: EmblemaEstado
  morta: boolean
  selecionada: boolean
  onClick: (evento: { stopPropagation: () => void }) => void
}

const EMOJI_EMBLEMA: Record<Exclude<EmblemaEstado, null>, string> = {
  sede: '💧',
  praga: '🐛',
  stress: '⚠️',
  pronta: '✨',
}

/**
 * Vaso + planta, 100% DOM/CSS -- substitui `three/Plant3D.tsx` (vaso +
 * modelo `.glb` reais da Kenney). Cada fase de crescimento é uma
 * combinação diferente de "folhas" (divs arredondados) por cima do mesmo
 * vaso, em vez de trocar de modelo 3D; a fase "adulta" acrescenta pontos
 * na cor de destaque da categoria (fruto/flor) e o emblema "✨ pronta".
 * Ver `garden/estadoVisual.ts` para a lógica (inalterada) de que emblema
 * mostrar, e o README para a decisão de deixar de usar modelos `.glb`.
 */
export function PlantSprite({ x, z, fase, nome, acento, corEstado, emblema, morta, selecionada, onClick }: Props) {
  const { left, top } = mundoParaEcra(x, z)
  const zIndex = Math.round(profundidade(x, z) * 10)

  return (
    <div
      className={`vaso-raiz ${selecionada ? 'vaso-raiz--selecionada' : ''}`}
      style={{ transform: `translate(${left}px, ${top}px) translate(-50%, -100%)`, zIndex }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      role="button"
      tabIndex={0}
      aria-label={nome}
    >
      <div className={`vaso ${morta ? 'vaso--morta' : ''} vaso--${fase}`}>
        {emblema && (
          <span className={`vaso__emblema vaso__emblema--${emblema}`} aria-hidden="true">
            {EMOJI_EMBLEMA[emblema]}
          </span>
        )}

        <div className="vaso__folhagem">
          {(fase === 'jovem' || fase === 'adulta') && (
            <>
              <span className="vaso__folha vaso__folha--1" />
              <span className="vaso__folha vaso__folha--2" />
              <span className="vaso__folha vaso__folha--3" />
            </>
          )}
          {(fase === 'rebento' || fase === 'germinacao') && (
            <>
              <span className="vaso__folha vaso__folha--1 vaso__folha--pequena" />
              <span className="vaso__folha vaso__folha--2 vaso__folha--pequena" />
            </>
          )}
          {fase === 'adulta' && (
            <>
              <span className="vaso__fruto vaso__fruto--1" style={{ background: acento }} />
              <span className="vaso__fruto vaso__fruto--2" style={{ background: acento }} />
              <span className="vaso__fruto vaso__fruto--3" style={{ background: acento }} />
            </>
          )}
          {fase === 'semente' && <span className="vaso__semente" />}
        </div>

        <div className="vaso__corpo">
          <div className="vaso__terra" />
          <span className="vaso__indicador" style={{ background: corEstado }} />
        </div>
        <div className="vaso__sombra" />
      </div>

      <span className="vaso__nome">{nome}</span>
    </div>
  )
}
