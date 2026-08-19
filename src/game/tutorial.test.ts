import { describe, expect, it } from 'vitest'
import { proximaDicaContextual, type EstadoParaDicas } from './tutorial'

function estadoBase(sobrescrever: Partial<EstadoParaDicas> = {}): EstadoParaDicas {
  return {
    acoesFeitas: [],
    temPlantaComPraga: false,
    temPlantaAdulta: false,
    temVasoVazio: false,
    temParcelaLivre: true,
    temSementeNoInventario: false,
    moeda: 0,
    ...sobrescrever,
  }
}

describe('proximaDicaContextual', () => {
  it('devolve null quando nada se aplica', () => {
    expect(proximaDicaContextual(estadoBase(), [])).toBeNull()
  })

  it('sugere plantar quando ha vaso vazio + semente no inventario', () => {
    const dica = proximaDicaContextual(estadoBase({ temVasoVazio: true, temSementeNoInventario: true }), [])
    expect(dica?.id).toBe('dica-vaso-vazio')
  })

  it('sugere colocar vaso quando ha semente mas nenhum vaso vazio', () => {
    const dica = proximaDicaContextual(estadoBase({ temSementeNoInventario: true, temParcelaLivre: true }), [])
    expect(dica?.id).toBe('dica-colocar-vaso')
  })

  it('nao sugere uma acao ja feita', () => {
    const estado = estadoBase({ temVasoVazio: true, temSementeNoInventario: true, acoesFeitas: ['plantar'] })
    expect(proximaDicaContextual(estado, [])).toBeNull()
  })

  it('nao repete uma dica ja vista', () => {
    const estado = estadoBase({ temPlantaComPraga: true })
    expect(proximaDicaContextual(estado, ['dica-praga'])).toBeNull()
  })

  it('respeita a ordem de prioridade -- so devolve uma de cada vez', () => {
    const estado = estadoBase({ temVasoVazio: true, temSementeNoInventario: true, temPlantaComPraga: true })
    const dica = proximaDicaContextual(estado, [])
    expect(dica?.id).toBe('dica-vaso-vazio')
  })

  it('salta para a proxima dica elegivel se a 1a ja foi vista', () => {
    const estado = estadoBase({ temPlantaComPraga: true, temPlantaAdulta: true })
    const dica = proximaDicaContextual(estado, [])
    expect(dica?.id).toBe('dica-praga')
    expect(proximaDicaContextual(estado, ['dica-praga'])?.id).toBe('dica-vender')
  })
})
