import type { Especie, SementeInventario } from '../db/schema'

interface Props {
  aberto: boolean
  onFechar: () => void
  inventario: SementeInventario[]
  especies: Especie[]
  onPlantar: (speciesId: string) => void
}

/**
 * Seletor de semente para um vaso já colocado e vazio -- só lista o que já
 * está no inventário (comprado na loja, ver `ShopSheet.tsx`), nunca planta
 * sozinho nem deixa escolher uma espécie que não tenhas comprado (ver
 * README "Colocação em fileiras", 2026-08-19).
 */
export function SeedPickerSheet({ aberto, onFechar, inventario, especies, onPlantar }: Props) {
  if (!aberto) return null
  const especiesPorId = new Map(especies.map((e) => [e.id, e]))
  const disponiveis = inventario.filter((i) => i.quantidade > 0)

  return (
    <div className="plant-sheet plant-sheet--picker">
      <button className="plant-sheet__fechar" onClick={onFechar} aria-label="Fechar">
        ×
      </button>
      <div className="secao__titulo">Plantar semente do inventário</div>
      {disponiveis.length === 0 ? (
        <p className="vazio">Não tens sementes por plantar -- compra na Loja primeiro.</p>
      ) : (
        <div className="chip-row">
          {disponiveis.map((item) => {
            const especie = especiesPorId.get(item.speciesId)
            return (
              <button key={item.speciesId} className="chip" onClick={() => onPlantar(item.speciesId)}>
                🌱 {especie?.nome ?? item.speciesId} × {item.quantidade}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
