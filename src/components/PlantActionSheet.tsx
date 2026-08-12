import type { Especie, ItemLoja, NivelLuz, PlantaPossuida } from '../db/schema'
import { PlantStage } from './PlantStage'

interface Props {
  planta: PlantaPossuida
  especieNome: string
  especie: Especie | undefined
  onFechar: () => void
  onRegar: () => void
  onMudarSol: (posicao: NivelLuz) => void
  onTransplantar: (incrementoCm: number) => void
  onTratarPraga: () => void
  onVender: () => void
  remedioDisponivel?: ItemLoja
  onComprarRemedio: (itemLojaId: number) => void
}

/** Painel de acoes da planta selecionada, como bottom sheet fixo sobre o Canvas 3D -- PlantStage reaproveitado tal como esta. */
export function PlantActionSheet({ onFechar, ...plantStageProps }: Props) {
  return (
    <div className="plant-sheet">
      <button className="plant-sheet__fechar" onClick={onFechar} aria-label="Fechar">
        ×
      </button>
      <PlantStage {...plantStageProps} />
    </div>
  )
}
