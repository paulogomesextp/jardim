/**
 * Estado de input partilhado, fora do React -- lido a cada frame de um
 * requestAnimationFrame simples (ver `useAvatarLoop` em Avatar.tsx). Nunca
 * usar useState para isto: mudaria a cada frame e forçaria re-render de
 * toda a árvore React 60x/seg. Portado de `three/movement.ts` (removido
 * junto com o resto do R3F) -- mesma convenção x/z, sem THREE.Vector3.
 */

// direcao do teclado/joystick, cada eixo em [-1, 1], "espaco de ecra": x=esquerda/direita, z=cima/baixo
export const inputVector = { x: 0, z: 0 }

// posicao/velocidade do avatar no mundo, atualizada a cada frame -- lida por
// GardenScene (camara) e pelo watcher de proximidade sem precisar de React state
export const avatarPos = { x: 0, z: 0 }

// destino de clique/tap-to-move no mundo; null quando o avatar nao esta a andar para um alvo
export const moveTarget: { current: { x: number; z: number } | null } = { current: null }

export const VELOCIDADE_AVATAR = 4.2 // unidades de mundo/seg
export const RAIO_PROXIMIDADE = 1.2
export const RAIO_HISTERESE = 1.8
export const DISTANCIA_APROXIMACAO = 1.0 // quanto o avatar para antes do centro da planta ao ser chamado por tap

const TECLAS_X: Record<string, number> = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 }
const TECLAS_Z: Record<string, number> = { KeyW: -1, ArrowUp: -1, KeyS: 1, ArrowDown: 1 }
const teclasPressionadas = new Set<string>()

function recalcularInputTeclado() {
  let x = 0
  let z = 0
  for (const codigo of teclasPressionadas) {
    if (codigo in TECLAS_X) x += TECLAS_X[codigo]
    if (codigo in TECLAS_Z) z += TECLAS_Z[codigo]
  }
  inputVector.x = Math.sign(x)
  inputVector.z = Math.sign(z)
}

/** WASD/setas -> inputVector, direto (sem passar por useState/render). Chamar uma vez no topo da cena. */
export function ligarInputTeclado(): () => void {
  function aoPressionar(e: KeyboardEvent) {
    if (!(e.code in TECLAS_X) && !(e.code in TECLAS_Z)) return
    teclasPressionadas.add(e.code)
    recalcularInputTeclado()
  }
  function aoLargar(e: KeyboardEvent) {
    teclasPressionadas.delete(e.code)
    recalcularInputTeclado()
  }
  window.addEventListener('keydown', aoPressionar)
  window.addEventListener('keyup', aoLargar)
  return () => {
    window.removeEventListener('keydown', aoPressionar)
    window.removeEventListener('keyup', aoLargar)
    teclasPressionadas.clear()
    inputVector.x = 0
    inputVector.z = 0
  }
}

/**
 * Converte o input "de ecrã" (ix=esquerda/direita, iz=cima/baixo, o que o
 * joystick/teclado realmente empurra) em direção do mundo (dx,dz de
 * `game/layout.ts`), de forma a que empurrar "para cima" mova o avatar
 * visualmente para cima no ecrã, "direita" para a direita, etc. -- controlo
 * relativo ao ecrã, não ao grid isométrico por baixo (mais intuitivo num
 * joystick tátil do que ter de "pensar em diagonal").
 *
 * `mundoParaEcra` projeta como `left=(x-z)*a, top=(x+z)*b` -- para um dado
 * (ix,iz) desejado no ecrã, resolve-se o sistema `dx-dz=ix, dx+dz=iz`
 * (a escala de a/b não importa aqui: o resultado só serve para normalizar
 * a direção antes de aplicar a velocidade, ver Avatar.tsx). Coberto por
 * `movement.test.ts` com as 4 direções cardeais -- corrigido nesta sessão
 * depois de a primeira versão (uma rotação de 45° mal derivada) falhar
 * exatamente esses testes; sem eles, este bug de sinal só apareceria como
 * "o avatar anda na diagonal errada", algo que a verificação por DOM/
 * computed-style não apanha sozinha (precisa mesmo de ver o movimento).
 */
export function inputParaMundo(ix: number, iz: number): { dx: number; dz: number } {
  return {
    dx: (ix + iz) / 2,
    dz: (iz - ix) / 2,
  }
}

/**
 * Sinal de "ação em curso" do avatar (regar/tratar/vender/plantar) -- pub/sub
 * simples fora do React, mesma família de `inputVector`/`moveTarget`, mas
 * este muda raramente (só quando uma ação é escolhida no balão de fala,
 * `PlantSpeechMenu.tsx`), por isso os subscritores usam `useState` normal em
 * vez de ler a cada frame -- só o `Avatar.tsx` precisa disto, para mostrar o
 * regador/faíscas/moeda por cima do boneco durante a animação da ação.
 */
export type AcaoAvatar = 'regar' | 'tratar' | 'vender' | 'plantar' | 'sol' | null
let acaoAtual: AcaoAvatar = null
const ouvintesAcao = new Set<(a: AcaoAvatar) => void>()

export function dispararAcaoAvatar(tipo: Exclude<AcaoAvatar, null>, duracaoMs = 900) {
  acaoAtual = tipo
  for (const cb of ouvintesAcao) cb(acaoAtual)
  setTimeout(() => {
    if (acaoAtual !== tipo) return // uma acao mais recente ja tomou o lugar, nao a interrompas
    acaoAtual = null
    for (const cb of ouvintesAcao) cb(null)
  }, duracaoMs)
}

export function ouvirAcaoAvatar(cb: (a: AcaoAvatar) => void): () => void {
  ouvintesAcao.add(cb)
  return () => ouvintesAcao.delete(cb)
}
