export interface SlotJardim {
  index: number
  x: number
  z: number
}

export interface LimitesJardim {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const SLOT_CELL = 2.1 // espaco entre parcelas na grelha
const GRID_COLUNAS = 8
const SLOTS_MINIMOS = 64 // >= 8 fileiras, cobre confortavelmente o jardim de demonstracao (50 plantas)
const FOLGA_LINHAS_EXTRA = 8 // fileiras vazias extra sempre visiveis alem das ja ocupadas, para "crescer" o jardim parecer natural

/**
 * Jardim como grelha FIXA de parcelas (substitui `calcularLocalizacoes`, que
 * empacotava dinamicamente as plantas possuidas em 2 canteiros por fase --
 * ver README "Colocacao em fileiras", 2026-08-19). As parcelas existem
 * independentemente de teres ou nao um vaso lá colocado: o jogo já não
 * decide sozinho onde uma planta nova aparece, é sempre o jogador a
 * escolher uma parcela livre. Pura e determinística (sem `Math.random`),
 * cresce automaticamente (mais fileiras) se já tiveres mais vasos
 * colocados do que a grelha mínima cobre, para uma gravação antiga com
 * muitos vasos nunca perder acesso a nenhum.
 */
export function gerarSlots(minimoSlots: number = SLOTS_MINIMOS): SlotJardim[] {
  const totalNecessario = Math.max(minimoSlots, SLOTS_MINIMOS)
  const linhasOcupadas = Math.ceil(totalNecessario / GRID_COLUNAS)
  const linhas = linhasOcupadas + FOLGA_LINHAS_EXTRA
  const total = linhas * GRID_COLUNAS

  const largura = (GRID_COLUNAS - 1) * SLOT_CELL
  const profundidade = (linhas - 1) * SLOT_CELL

  const slots: SlotJardim[] = []
  for (let index = 0; index < total; index++) {
    const col = index % GRID_COLUNAS
    const linha = Math.floor(index / GRID_COLUNAS)
    slots.push({
      index,
      x: -largura / 2 + col * SLOT_CELL,
      z: -profundidade / 2 + linha * SLOT_CELL,
    })
  }
  return slots
}

/** Quantos slots a grelha precisa de ter, no minimo, para incluir o slotIndex mais alto ja usado (vasos existentes). */
export function slotsMinimosPara(maiorSlotIndexUsado: number): number {
  return Math.max(SLOTS_MINIMOS, maiorSlotIndexUsado + 1)
}

/** Retangulo que envolve todas as parcelas, com margem -- usado para dimensionar o chao e limitar o avatar (paredes invisiveis). */
export function limitesJardim(slots: SlotJardim[], margem = 3): LimitesJardim {
  if (slots.length === 0) return { minX: -margem, maxX: margem, minZ: -margem, maxZ: margem }
  const xs = slots.map((s) => s.x)
  const zs = slots.map((s) => s.z)
  return {
    minX: Math.min(...xs) - margem,
    maxX: Math.max(...xs) + margem,
    minZ: Math.min(...zs) - margem,
    maxZ: Math.max(...zs) + margem,
  }
}
