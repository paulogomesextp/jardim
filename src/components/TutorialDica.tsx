import type { DicaContextual } from '../game/tutorial'

interface Props {
  dica: DicaContextual
  onFechar: () => void
}

/**
 * Banner de dica contextual -- sugere a próxima tarefa que o jogador ainda
 * não experimentou (game/tutorial.ts::proximaDicaContextual), não bloqueia
 * o jogo. Fica "vista" para sempre assim que fechada (`marcarTutorialVisto`,
 * db/actions.ts), nunca repete.
 */
export function TutorialDica({ dica, onFechar }: Props) {
  return (
    <div className="dica-toast hud__toast">
      <span className="dica-toast__emoji" aria-hidden="true">
        {dica.emoji}
      </span>
      <div className="dica-toast__corpo">
        <div className="dica-toast__titulo">{dica.titulo}</div>
        <div className="dica-toast__texto">{dica.texto}</div>
      </div>
      <button className="dica-toast__fechar" onClick={onFechar} aria-label="Fechar dica">
        ×
      </button>
    </div>
  )
}
