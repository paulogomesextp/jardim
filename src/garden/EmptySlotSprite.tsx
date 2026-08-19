import { mundoParaEcra, profundidade } from './iso'

interface Props {
  x: number
  z: number
  perto: boolean
  onClick: () => void
}

/**
 * Parcela livre, sem vaso -- so terra a espera (ver README "Colocacao em
 * fileiras", 2026-08-19). Clicavel para abrir o seletor "Colocar vaso"; o
 * "+" so aparece com opacidade quando o avatar esta perto, para nao poluir
 * visualmente uma grelha grande cheia de parcelas vazias.
 */
export function EmptySlotSprite({ x, z, perto, onClick }: Props) {
  const { left, top } = mundoParaEcra(x, z)
  const zIndex = Math.round(profundidade(x, z) * 10) - 1 // sempre por baixo de vasos/avatar na mesma celula

  return (
    <div
      className={`parcela-raiz ${perto ? 'parcela-raiz--perto' : ''}`}
      style={{ transform: `translate(${left}px, ${top}px)`, zIndex }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      role="button"
      tabIndex={0}
      aria-label="Parcela livre -- colocar vaso"
    >
      <div className="parcela">
        <span className="parcela__mais" aria-hidden="true">
          ➕
        </span>
      </div>
    </div>
  )
}
