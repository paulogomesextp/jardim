import type { NivelLuz, PlantaPossuida } from '../db/schema'
import { NOMES_PRAGA } from '../game/pragas'

const ROTULOS_LUZ: Record<NivelLuz, string> = {
  sol_pleno: 'Sol pleno',
  sol_parcial: 'Sol parcial',
  sombra_parcial: 'Sombra parcial',
  sombra: 'Sombra',
}

const ROTULOS_FASE: Record<string, string> = {
  semente: 'Semente',
  germinacao: 'Germinação',
  rebento: 'Rebento',
  jovem: 'Jovem',
  adulta: 'Adulta',
}

interface Props {
  planta: PlantaPossuida
  especieNome: string
  onRegar: () => void
  onMudarSol: (posicao: NivelLuz) => void
  onAumentarVaso: () => void
  onTratarPraga: () => void
  onVender: () => void
}

export function PlantCard({ planta, especieNome, onRegar, onMudarSol, onAumentarVaso, onTratarPraga, onVender }: Props) {
  const corSaude = planta.saude >= 70 ? '#166534' : planta.saude >= 40 ? '#9A3412' : '#991B1B'

  return (
    <div
      style={{
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 16,
        background: planta.estado === 'morta' ? '#F1F5F9' : '#FFFFFF',
        opacity: planta.estado === 'morta' ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 220,
      }}
    >
      <strong>{planta.nomeCustom || especieNome}</strong>
      <span style={{ fontSize: 13, color: '#334155' }}>
        Fase: {ROTULOS_FASE[planta.fase]} {planta.estado === 'morta' ? '· Morta 💀' : ''}
        {planta.estado === 'praga' && planta.pragaAtual ? ` · 🐛 ${NOMES_PRAGA[planta.pragaAtual]}` : ''}
      </span>

      <div style={{ background: '#F1F5F9', borderRadius: 6, overflow: 'hidden', height: 10 }}>
        <div
          style={{
            width: `${planta.saude}%`,
            background: corSaude,
            height: '100%',
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: corSaude }}>Saúde: {Math.round(planta.saude)}/100</span>

      <span style={{ fontSize: 12, color: '#64748B' }}>
        Vaso: {planta.tamanhoVasoAtual}cm · Posição: {ROTULOS_LUZ[planta.posicaoSol]}
      </span>

      {planta.estado !== 'morta' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <button onClick={onRegar}>💧 Regar</button>
          <select
            value={planta.posicaoSol}
            onChange={(e) => onMudarSol(e.target.value as NivelLuz)}
          >
            {Object.entries(ROTULOS_LUZ).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
          <button onClick={onAumentarVaso}>🪴 +5cm vaso (10🪙)</button>
          {planta.estado === 'praga' && <button onClick={onTratarPraga}>🧪 Tratar praga</button>}
          <button onClick={onVender}>💰 Vender</button>
        </div>
      )}
    </div>
  )
}
