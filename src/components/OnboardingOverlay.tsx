import { useState } from 'react'
import type { PassoOnboarding } from '../game/tutorial'

interface Props {
  passos: PassoOnboarding[]
  onConcluir: () => void
}

/**
 * Tutorial inicial, sequência de cartões (pedido do Paulo, 2026-08-19):
 * mostrado uma única vez, logo depois do primeiro login (`GardenView.tsx`
 * decide quando mostrar, com base em `Jogador.tutorialVisto`). "Saltar"
 * fecha logo -- nunca obrigatório, só a primeira coisa que aparece.
 */
export function OnboardingOverlay({ passos, onConcluir }: Props) {
  const [indice, setIndice] = useState(0)
  const passo = passos[indice]
  const ultimo = indice === passos.length - 1

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <span className="tutorial-card__emoji" aria-hidden="true">
          {passo.emoji}
        </span>
        <h2 className="tutorial-card__titulo">{passo.titulo}</h2>
        <p className="tutorial-card__texto">{passo.texto}</p>
        <div className="tutorial-card__pontos" aria-hidden="true">
          {passos.map((p, i) => (
            <span key={p.id} className={`tutorial-card__ponto ${i === indice ? 'tutorial-card__ponto--ativo' : ''}`} />
          ))}
        </div>
        <div className="tutorial-card__acoes">
          <button className="tutorial-card__saltar" onClick={onConcluir}>
            Saltar
          </button>
          <button className="tutorial-card__seguinte" onClick={() => (ultimo ? onConcluir() : setIndice(indice + 1))}>
            {ultimo ? 'Começar a jogar 🌿' : 'Seguinte'}
          </button>
        </div>
      </div>
    </div>
  )
}
