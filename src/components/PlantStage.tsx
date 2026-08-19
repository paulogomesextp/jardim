import { useEffect, useRef, useState } from 'react'
import type { Especie, ItemLoja, NivelLuz, PlantaPossuida, TipoVaso, VasoPossuido } from '../db/schema'
import { CHANCE_SUCESSO_TRATAMENTO_MANUAL, NOMES_PRAGA } from '../game/pragas'
import { custoTransplante, INCREMENTOS_VASO_CM } from '../db/actions'
import { formatarHoras, proximaFaseInfo, proximaRegaInfo } from '../game/temporizadores'
import { escolherImagemPlanta } from '../game/imagemPlanta'
import { CORES_VASO, TIPOS_VASO } from '../game/vasoVisual'

const ROTULOS_LUZ: Record<NivelLuz, string> = {
  sol_pleno: 'Sol pleno',
  sol_parcial: 'Sol parcial',
  sombra_parcial: 'Sombra parcial',
  sombra: 'Sombra',
}

const ROTULOS_FASE: Record<string, string> = {
  semente: 'Semente',
  germinacao: 'Germinação',
  rebento: 'Rebento',
  jovem: 'Jovem',
  adulta: 'Adulta',
}

interface Props {
  planta: PlantaPossuida
  especieNome: string
  especie: Especie | undefined
  vasoAtual: VasoPossuido | undefined
  onRegar: () => void
  onMudarSol: (posicao: NivelLuz) => void
  onTransplantar: (incrementoCm: number, novoTipo: TipoVaso, novaCor: string) => void
  onTratarPraga: () => void
  onVender: () => void
  remedioDisponivel?: ItemLoja
  onComprarRemedio: (itemLojaId: number) => void
}

export function PlantStage({
  planta,
  especieNome,
  especie,
  vasoAtual,
  onRegar,
  onMudarSol,
  onTransplantar,
  onTratarPraga,
  onVender,
  remedioDisponivel,
  onComprarRemedio,
}: Props) {
  const corSaude = planta.saude >= 70 ? 'var(--primaria)' : planta.saude >= 40 ? 'var(--aviso)' : 'var(--erro)'
  // por omissao um crescimento pequeno (nao o 1o valor da lista, que agora inclui reducoes -- ver INCREMENTOS_VASO_CM)
  const [incrementoEscolhido, setIncrementoEscolhido] = useState<number>(
    INCREMENTOS_VASO_CM.find((cm) => cm > 0) ?? INCREMENTOS_VASO_CM[0],
  )
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoVaso>(vasoAtual?.tipo ?? TIPOS_VASO[0].id)
  const [corEscolhida, setCorEscolhida] = useState<string>(vasoAtual?.cor ?? CORES_VASO[0].valor)
  const [agora, setAgora] = useState(() => Date.now())

  // pequenas animacoes de feedback por acao (estilo jogo mobile), nao guardam
  // nenhum estado do jogo -- so efeitos visuais efemeros
  const [flutuantes, setFlutuantes] = useState<{ id: number; emoji: string }[]>([])
  const [pulsoSaude, setPulsoSaude] = useState(false)
  const [brilhoSol, setBrilhoSol] = useState(false)
  const [crescerPulso, setCrescerPulso] = useState(false)
  const proximoIdFlutuante = useRef(0)

  function dispararFlutuante(emoji: string) {
    const id = proximoIdFlutuante.current++
    setFlutuantes((atual) => [...atual, { id, emoji }])
    setTimeout(() => setFlutuantes((atual) => atual.filter((f) => f.id !== id)), 1100)
  }

  function pulsarSaude() {
    setPulsoSaude(true)
    setTimeout(() => setPulsoSaude(false), 650)
  }

  function pulsarCrescimento() {
    setCrescerPulso(true)
    setTimeout(() => setCrescerPulso(false), 500)
  }

  // atualiza os temporizadores (e a foto, se entrar/sair de sede) a cada minuto sem recarregar a pagina
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const viva = planta.estado !== 'morta'
  const rega = especie && viva ? proximaRegaInfo(planta, especie, agora) : null
  const faseInfo = especie && viva ? proximaFaseInfo(planta, especie, agora) : null
  const imagem = escolherImagemPlanta(planta, especie, agora)

  return (
    <div className={`planta-stage ${planta.estado === 'morta' ? 'planta-stage--morta' : ''}`}>
      <div className="planta-stage__imagem-wrap">
        {imagem.url && (
          <img
            className={`planta-stage__imagem ${crescerPulso ? 'planta-stage__imagem--crescer' : ''}`}
            src={imagem.url}
            alt={imagem.rotulo ?? especieNome}
            loading="lazy"
            draggable={false}
          />
        )}
        {imagem.rotulo && (
          <span className={`imagem-badge imagem-badge--${imagem.motivo}`}>
            {imagem.motivo === 'praga' ? '🐛' : '💧'} {imagem.rotulo}
          </span>
        )}
        {brilhoSol && <span className="brilho-sol" aria-hidden="true" />}
        {flutuantes.map((f) => (
          <span key={f.id} className="flutuante" aria-hidden="true">
            {f.emoji}
          </span>
        ))}
      </div>

      <div className="planta-stage__corpo">
        <div className="planta-stage__topo">
          <span className="planta-stage__nome">{planta.nomeCustom || especieNome}</span>
          <span className={`badge ${planta.estado === 'morta' ? 'badge--morta' : 'badge--fase'}`}>
            {planta.estado === 'morta' ? 'Morta 💀' : ROTULOS_FASE[planta.fase]}
          </span>
        </div>

        {planta.estado === 'praga' && planta.pragaAtual && (
          <span className="badge badge--praga">🐛 {NOMES_PRAGA[planta.pragaAtual]}</span>
        )}

        <div className={`barra-saude ${pulsoSaude ? 'barra-saude--pulso' : ''}`}>
          <div className="barra-saude__preenchimento" style={{ width: `${planta.saude}%`, background: corSaude }} />
        </div>

        <div className="planta-stage__stats">
          <span>Saúde: {Math.round(planta.saude)}/100</span>
          <span>
            Vaso: {planta.tamanhoVasoAtual}cm · {ROTULOS_LUZ[planta.posicaoSol]}
          </span>
        </div>

        {(rega || faseInfo) && (
          <div className="chip-row">
            {rega && (
              <span className={`temporizador ${rega.atrasado ? 'temporizador--atrasado' : rega.horas < 6 ? 'temporizador--brevemente' : ''}`}>
                💧 {rega.atrasado ? `atrasada ${formatarHoras(rega.horas)}` : `em ${formatarHoras(rega.horas)}`}
              </span>
            )}
            {faseInfo && (
              <span className={`temporizador ${faseInfo.atrasado ? '' : faseInfo.horas < 6 ? 'temporizador--brevemente' : ''}`}>
                🌱 {faseInfo.atrasado ? 'pronta a avançar' : `próx. fase em ${formatarHoras(faseInfo.horas)}`}
              </span>
            )}
          </div>
        )}

        {viva && (
          <div className="acoes-menu">
            <div className="acoes-linha">
              <button
                className="acao-btn--regar"
                onClick={() => {
                  dispararFlutuante('💧')
                  pulsarSaude()
                  onRegar()
                }}
              >
                💧 Regar
              </button>
              <select
                value={planta.posicaoSol}
                onChange={(e) => {
                  const posicao = e.target.value as NivelLuz
                  dispararFlutuante(posicao === 'sol_pleno' || posicao === 'sol_parcial' ? '☀️' : '🌥️')
                  setBrilhoSol(true)
                  setTimeout(() => setBrilhoSol(false), 750)
                  onMudarSol(posicao)
                }}
              >
                {Object.entries(ROTULOS_LUZ).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="acoes-linha">
              <select value={incrementoEscolhido} onChange={(e) => setIncrementoEscolhido(Number(e.target.value))}>
                {INCREMENTOS_VASO_CM.map((cm) => (
                  <option key={cm} value={cm}>
                    {cm > 0 ? `+${cm}` : cm}cm ({custoTransplante(cm)}🪙)
                  </option>
                ))}
              </select>
              <select value={tipoEscolhido} onChange={(e) => setTipoEscolhido(e.target.value as TipoVaso)}>
                {TIPOS_VASO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  dispararFlutuante('🪴')
                  pulsarCrescimento()
                  onTransplantar(incrementoEscolhido, tipoEscolhido, corEscolhida)
                }}
              >
                🪴 Transplantar
              </button>
            </div>
            <div className="acoes-linha acoes-linha--cores">
              {CORES_VASO.map((c) => (
                <button
                  key={c.id}
                  className={`amostra-cor amostra-cor--mini ${corEscolhida === c.valor ? 'amostra-cor--ativa' : ''}`}
                  style={{ background: c.valor }}
                  onClick={() => setCorEscolhida(c.valor)}
                  aria-label={c.nome}
                  title={c.nome}
                  type="button"
                />
              ))}
              <button
                className="acao-btn--vender"
                onClick={() => {
                  dispararFlutuante('🪙')
                  onVender()
                }}
              >
                💰 Vender
              </button>
            </div>
            {planta.estado === 'praga' && (
              <div className="acoes-linha">
                <button
                  className="acao-btn--praga"
                  onClick={() => {
                    dispararFlutuante('✨')
                    onTratarPraga()
                  }}
                >
                  🧪 Tratar grátis ({Math.round(CHANCE_SUCESSO_TRATAMENTO_MANUAL * 100)}%)
                </button>
                {remedioDisponivel && (
                  <button
                    className="acao-btn--remedio"
                    onClick={() => {
                      dispararFlutuante('💊')
                      onComprarRemedio(remedioDisponivel.id!)
                    }}
                  >
                    💊 {remedioDisponivel.nome} ({remedioDisponivel.preco}🪙)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
