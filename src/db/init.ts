import { db } from './schema'
import { ESPECIES_INICIAIS } from './seedSpecies'
import { gerarItensLojaIniciais } from './seedShop'
import { semearJardimDemo } from './actions'

/**
 * Pede ao browser para NÃO apagar os dados deste site sob pressão de
 * espaço em disco -- por omissão, um site "não persistido" (a maioria,
 * sobretudo se pouco usado ou não instalado) pode ter o IndexedDB inteiro
 * limpo pelo Chrome/Android sem aviso nenhum quando o telemóvel fica com
 * pouco espaço. Isto é uma causa real e comum de "o jogo perdeu tudo
 * sozinho" em PWAs -- pedido do Paulo (2026-08-19) depois de reportar
 * perda de progresso. Não é garantido (o browser pode recusar), e no
 * Safari/iOS este API nem sequer existe -- por isso só ajuda, nunca é a
 * única rede de segurança; não faz mal nenhum tentar sempre.
 */
async function pedirArmazenamentoPersistente() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return
  try {
    const jaEra = await navigator.storage.persisted?.()
    if (jaEra) return
    await navigator.storage.persist()
  } catch {
    // API existe mas falhou (ex: browser antigo com implementacao parcial) -- silencioso, so um bonus
  }
}

/**
 * Semeia especies, loja e o registo do jogador. As especies sao sempre
 * "upsert" (bulkPut, chave string estavel) em vez de so semear na
 * primeira vez -- assim, se o catalogo mudar no codigo (ex: campos novos
 * como imagemUrl), quem ja tinha a app aberta antes fica com os dados
 * corrigidos sozinho no proximo carregamento, sem precisar de limpar
 * dados do site manualmente (foi um problema real ao testar no iOS).
 */
export async function inicializarDb() {
  await pedirArmazenamentoPersistente()
  await db.especies.bulkPut(ESPECIES_INICIAIS)

  const totalLoja = await db.loja.count()
  if (totalLoja === 0) {
    await db.loja.bulkAdd(gerarItensLojaIniciais())
  }

  const jogador = await db.jogador.get(1)
  if (!jogador) {
    // put (nao add) -- em StrictMode o efeito que chama inicializarDb corre 2x em
    // sequencia rapida; get(1) pode ver "nada" nas duas antes de qualquer escrita
    // terminar, e um segundo add() com a mesma chave fixa rebentava com ConstraintError
    await db.jogador.put({ id: 1, moeda: 50, totalColhidas: 0, xp: 0, acoesFeitas: [], tutorialVisto: [] })
  }

  await semearJardimDemo()
}
