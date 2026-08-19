import { useState } from 'react'
import type { TipoVaso } from '../db/schema'
import { CORES_VASO, TIPOS_VASO } from '../game/vasoVisual'

interface Props {
  aberto: boolean
  onFechar: () => void
  onConfirmar: (tipo: TipoVaso, cor: string) => void
}

/**
 * Seletor "Colocar vaso" -- abre ao clicar numa parcela livre (sem vaso).
 * Primeiro passo do fluxo de plantar (ver README "Colocação em fileiras",
 * 2026-08-19): escolher o tipo de vaso (preço varia) e a cor (cosmético,
 * grátis) antes de sequer poder escolher uma semente.
 */
export function PotPickerSheet({ aberto, onFechar, onConfirmar }: Props) {
  const [tipo, setTipo] = useState<TipoVaso>(TIPOS_VASO[0].id)
  const [cor, setCor] = useState<string>(CORES_VASO[0].valor)

  if (!aberto) return null
  return (
    <div className="plant-sheet plant-sheet--picker">
      <button className="plant-sheet__fechar" onClick={onFechar} aria-label="Fechar">
        ×
      </button>
      <div className="secao__titulo">Colocar vaso na parcela</div>

      <div className="picker__grupo">
        <span className="picker__rotulo">Tipo</span>
        <div className="chip-row">
          {TIPOS_VASO.map((t) => (
            <button
              key={t.id}
              className={`chip chip--vaso ${tipo === t.id ? 'chip--ativo' : ''}`}
              onClick={() => setTipo(t.id)}
            >
              🪴 {t.nome} — {t.precoBase}🪙
            </button>
          ))}
        </div>
      </div>

      <div className="picker__grupo">
        <span className="picker__rotulo">Cor</span>
        <div className="chip-row">
          {CORES_VASO.map((c) => (
            <button
              key={c.id}
              className={`amostra-cor ${cor === c.valor ? 'amostra-cor--ativa' : ''}`}
              style={{ background: c.valor }}
              onClick={() => setCor(c.valor)}
              aria-label={c.nome}
              title={c.nome}
            />
          ))}
        </div>
      </div>

      <button className="botao-confirmar" onClick={() => onConfirmar(tipo, cor)}>
        🪴 Colocar vaso
      </button>
    </div>
  )
}
