import type { ItemLoja } from './schema'
import { ESPECIES_INICIAIS } from './seedSpecies'

/**
 * Loja inicial: uma semente por especie do catalogo (preco = metade do
 * valorVendaBase, arbitrario) + um remedio por tipo de praga. Precos e
 * balanceamento a rever com o Paulo -- isto so fecha o ciclo tecnico
 * comprar->plantar / comprar->tratar / vender->ganhar moeda.
 */
export function gerarItensLojaIniciais(): ItemLoja[] {
  const sementes: ItemLoja[] = ESPECIES_INICIAIS.map((especie) => ({
    tipo: 'semente',
    speciesId: especie.id,
    nome: `Semente de ${especie.nome}`,
    preco: Math.max(5, Math.round(especie.valorVendaBase / 2)),
  }))

  const remedios: ItemLoja[] = [
    { tipo: 'remedio', pragaAlvo: 'aranhico', nome: 'Spray anti-aranhiço', preco: 10 },
    { tipo: 'remedio', pragaAlvo: 'oidio', nome: 'Fungicida para oídio', preco: 12 },
    { tipo: 'remedio', pragaAlvo: 'pulgao', nome: 'Sabão inseticida para pulgão', preco: 10 },
  ]

  return [...sementes, ...remedios]
}
