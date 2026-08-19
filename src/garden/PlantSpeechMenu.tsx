import type { PlantaComEspecie } from '../db/actions'
import { mundoParaEcra } from './iso'
import { dispararAcaoAvatar } from './movement'

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

/**
 * Balão de fala com ações rápidas, aparece por cima do vaso selecionado em
 * vez do painel antigo (`PlantActionSheet`, que ocupava o ecrã todo) --
 * pedido explícito do Paulo. Só as ações mais comuns vivem aqui (regar,
 * ciclar sol, tratar se houver praga, vender); tudo o resto (transplantar,
 * trocar de vaso, ver temporizadores) continua em "Detalhes", que abre o
 * `PlantActionSheet` de sempre por cima disto. Regar/tratar/vender disparam
 * também a animação do avatar (`dispararAcaoAvatar`, `movement.ts`) -- o
 * boneco "representa" a ação em vez de só a UI mudar por baixo.
 */
export function PlantSpeechMenu({ x, z, item, onRegar, onCiclarSol, onTratarPraga, onVender, onAbrirDetalhes, onFechar }: Props) {
  const { left, top } = mundoParaEcra(x, z)
  const viva = item.planta.estado !== 'morta'
  const nome = item.planta.nomeCustom || item.especieNome

  return (
    <div className="balao-raiz" style={{ transform: `translate(${left}px, ${top}px) translate(-50%, -100%)` }} onClick={(e) => e.stopPropagation()}>
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
              <button className="balao__opcao balao__opcao--sol" onClick={onCiclarSol}>
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
