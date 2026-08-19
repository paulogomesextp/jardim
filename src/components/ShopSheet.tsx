import { useState } from 'react'
import type { Especie, ItemLoja } from '../db/schema'

interface Props {
  aberto: boolean
  onFechar: () => void
  especies: Especie[]
  sementes: ItemLoja[]
  onPlantar: (speciesId: string) => void
  onComprarSemente: (itemId: number) => void
}

/** Loja/plantar-gratis, extraida do antigo cabecalho da GardenView -- aberta por botao no HUD sobre o Canvas 3D. */
export function ShopSheet({ aberto, onFechar, especies, sementes, onPlantar, onComprarSemente }: Props) {
  // feedback "bouncy" por clique (estilo jogo mobile) -- guarda so a chave do
  // ultimo chip tocado, a classe CSS auto-remove-se a si propria via
  // animationend, nao precisa de limpar com setTimeout
  const [ultimoTocado, setUltimoTocado] = useState<string | null>(null)

  if (!aberto) return null
  return (
    <div className="plant-sheet plant-sheet--loja">
      <button className="plant-sheet__fechar" onClick={onFechar} aria-label="Fechar">
        ×
      </button>
      <div className="secao">
        <div className="secao__titulo">Plantar semente nova (grátis, para testes)</div>
        <div className="chip-row">
          {especies.map((e) => (
            <button
              key={e.id}
              className={`chip ${ultimoTocado === `e${e.id}` ? 'chip--pop' : ''}`}
              onAnimationEnd={() => setUltimoTocado((atual) => (atual === `e${e.id}` ? null : atual))}
              onClick={() => {
                setUltimoTocado(`e${e.id}`)
                onPlantar(e.id)
              }}
            >
              🌱 {e.nome}
            </button>
          ))}
        </div>
      </div>
      <div className="secao">
        <div className="secao__titulo">Loja de sementes</div>
        <div className="chip-row">
          {sementes.map((item) => (
            <button
              key={item.id}
              className={`chip ${ultimoTocado === `s${item.id}` ? 'chip--pop' : ''}`}
              onAnimationEnd={() => setUltimoTocado((atual) => (atual === `s${item.id}` ? null : atual))}
              onClick={() => {
                setUltimoTocado(`s${item.id}`)
                onComprarSemente(item.id!)
              }}
            >
              🛒 {item.nome} — {item.preco}🪙
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
