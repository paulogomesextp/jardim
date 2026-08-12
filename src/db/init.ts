import { db } from './schema'
import { ESPECIES_INICIAIS } from './seedSpecies'
import { gerarItensLojaIniciais } from './seedShop'

/**
 * Semeia especies, loja e o registo do jogador. As especies sao sempre
 * "upsert" (bulkPut, chave string estavel) em vez de so semear na
 * primeira vez -- assim, se o catalogo mudar no codigo (ex: campos novos
 * como imagemUrl), quem ja tinha a app aberta antes fica com os dados
 * corrigidos sozinho no proximo carregamento, sem precisar de limpar
 * dados do site manualmente (foi um problema real ao testar no iOS).
 */
export async function inicializarDb() {
  await db.especies.bulkPut(ESPECIES_INICIAIS)

  const totalLoja = await db.loja.count()
  if (totalLoja === 0) {
    await db.loja.bulkAdd(gerarItensLojaIniciais())
  }

  const jogador = await db.jogador.get(1)
  if (!jogador) {
    await db.jogador.add({ id: 1, moeda: 50 })
  }
}
