import { db } from './schema'
import { ESPECIES_INICIAIS } from './seedSpecies'

/** Semeia especies e o registo do jogador na primeira vez que a app abre. */
export async function inicializarDb() {
  const totalEspecies = await db.especies.count()
  if (totalEspecies === 0) {
    await db.especies.bulkAdd(ESPECIES_INICIAIS)
  }

  const jogador = await db.jogador.get(1)
  if (!jogador) {
    await db.jogador.add({ id: 1, moeda: 50 })
  }
}
