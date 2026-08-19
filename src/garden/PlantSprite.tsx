import type { Fase, TipoVaso } from '../db/schema'
import type { EmblemaEstado } from './estadoVisual'
import type { FormaFolha, FormaFruto } from './especieVisual'
import { mundoParaEcra, profundidade } from './iso'

interface Props {
  x: number
  z: number
  tipoVaso: TipoVaso
  corVaso: string
  fase: Fase | null // null = vaso colocado mas ainda vazio (por plantar)
  nome: string
  folha: FormaFolha
  fruto: FormaFruto
  corFruto: string
  corEstado: string
  emblema: EmblemaEstado
  morta: boolean
  selecionada: boolean
  perto: boolean
  onClick: (evento: { stopPropagation: () => void }) => void
}

const EMOJI_EMBLEMA: Record<Exclude<EmblemaEstado, null>, string> = {
  sede: '💧',
  praga: '🐛',
  stress: '⚠️',
  pronta: '✨',
}

/**
 * Vaso + planta, 100% DOM/CSS. Cada fase de crescimento é uma combinação
 * diferente de "folhas" (divs arredondados) por cima do mesmo vaso; a forma
 * da folhagem/fruto varia por espécie (`folha`/`fruto`, ver
 * `especieVisual.ts`), não só a cor -- pedido do Paulo para a arte ser
 * "diferenciada conforme a planta". O vaso em si também varia visualmente
 * por `tipoVaso` (silhueta, `.vaso__corpo--<tipo>`) e `corVaso` (aplicada via
 * `--vaso-cor`), escolhidos pelo jogador ao colocar/trocar de vaso (ver
 * README "Colocação em fileiras", 2026-08-19).
 *
 * `fase === null` desenha um vaso com terra mas sem folhagem (colocado,
 * ainda por plantar) -- clicável para abrir o seletor de sementes do
 * inventário.
 */
export function PlantSprite({
  x,
  z,
  tipoVaso,
  corVaso,
  fase,
  nome,
  folha,
  fruto,
  corFruto,
  corEstado,
  emblema,
  morta,
  selecionada,
  perto,
  onClick,
}: Props) {
  const { left, top } = mundoParaEcra(x, z)
  const zIndex = Math.round(profundidade(x, z) * 10)
  const vazio = fase === null

  return (
    <div
      className={`vaso-raiz ${selecionada ? 'vaso-raiz--selecionada' : ''} ${perto ? 'vaso-raiz--perto' : ''}`}
      style={{ transform: `translate(${left}px, ${top}px) translate(-50%, -100%)`, zIndex, ['--vaso-cor' as string]: corVaso }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      role="button"
      tabIndex={0}
      aria-label={vazio ? `${nome} (vaso vazio)` : nome}
    >
      <div className={`vaso ${morta ? 'vaso--morta' : ''} ${fase ? `vaso--${fase}` : 'vaso--vazio'}`}>
        {!vazio && emblema && (
          <span className={`vaso__emblema vaso__emblema--${emblema}`} aria-hidden="true">
            {EMOJI_EMBLEMA[emblema]}
          </span>
        )}
        {vazio && <span className="vaso__emblema vaso__emblema--plantar" aria-hidden="true">➕</span>}

        {!vazio && (
          <div className={`vaso__folhagem vaso__folhagem--${folha}`}>
            {(fase === 'jovem' || fase === 'adulta') && (
              <>
                <span className="vaso__folha vaso__folha--1" />
                <span className="vaso__folha vaso__folha--2" />
                <span className="vaso__folha vaso__folha--3" />
                {folha === 'agulha' && <span className="vaso__folha vaso__folha--4" />}
              </>
            )}
            {(fase === 'rebento' || fase === 'germinacao') && (
              <>
                <span className="vaso__folha vaso__folha--1 vaso__folha--pequena" />
                <span className="vaso__folha vaso__folha--2 vaso__folha--pequena" />
              </>
            )}
            {fase === 'adulta' && fruto !== 'nenhum' && (
              <div className={`vaso__fruto-grupo vaso__fruto-grupo--${fruto}`} style={{ ['--fruto-cor' as string]: corFruto }}>
                {fruto === 'baga' && (
                  <>
                    <span className="vaso__fruto vaso__fruto--baga vaso__fruto--1" />
                    <span className="vaso__fruto vaso__fruto--baga vaso__fruto--2" />
                    <span className="vaso__fruto vaso__fruto--baga vaso__fruto--3" />
                  </>
                )}
                {fruto === 'flor_estrela' && (
                  <>
                    <span className="vaso__fruto vaso__fruto--estrela vaso__fruto--1" />
                    <span className="vaso__fruto vaso__fruto--estrela vaso__fruto--2" />
                  </>
                )}
                {fruto === 'flor_trombeta' && (
                  <>
                    <span className="vaso__fruto vaso__fruto--trombeta vaso__fruto--1" />
                    <span className="vaso__fruto vaso__fruto--trombeta vaso__fruto--2" />
                  </>
                )}
                {fruto === 'flor_grande' && (
                  <span className="vaso__flor-grande">
                    <span className="vaso__flor-grande__petala vaso__flor-grande__petala--1" />
                    <span className="vaso__flor-grande__petala vaso__flor-grande__petala--2" />
                    <span className="vaso__flor-grande__petala vaso__flor-grande__petala--3" />
                    <span className="vaso__flor-grande__petala vaso__flor-grande__petala--4" />
                    <span className="vaso__flor-grande__petala vaso__flor-grande__petala--5" />
                    <span className="vaso__flor-grande__centro" />
                  </span>
                )}
              </div>
            )}
            {fase === 'semente' && <span className="vaso__semente" />}
          </div>
        )}

        <div className="vaso__corpo-grupo">
          <div className={`vaso__corpo vaso__corpo--${tipoVaso}`} />
          <div className="vaso__terra" />
          {!vazio && <span className="vaso__indicador" style={{ background: corEstado }} />}
        </div>
        <div className="vaso__sombra" />
      </div>

      <span className="vaso__nome">{nome}</span>
    </div>
  )
}
