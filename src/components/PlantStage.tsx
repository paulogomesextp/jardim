import { useEffect, useState } from 'react'
import type { Especie, ItemLoja, NivelLuz, PlantaPossuida } from '../db/schema'
import { CHANCE_SUCESSO_TRATAMENTO_MANUAL, NOMES_PRAGA } from '../game/pragas'
import { custoTransplante, INCREMENTOS_VASO_CM } from '../db/actions'
import { formatarHoras, proximaFaseInfo, proximaRegaInfo } from '../game/temporizadores'
import { escolherImagemPlanta } from '../game/imagemPlanta'

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
  onRegar: () => void
  onMudarSol: (posicao: NivelLuz) => void
  onTransplantar: (incrementoCm: number) => void
  onTratarPraga: () => void
  onVender: () => void
  remedioDisponivel?: ItemLoja
  onComprarRemedio: (itemLojaId: number) => void
}

export function PlantStage({
  planta,
  especieNome,
  especie,
  onRegar,
  onMudarSol,
  onTransplantar,
  onTratarPraga,
  onVender,
  remedioDisponivel,
  onComprarRemedio,
}: Props) {
  const corSaude = planta.saude >= 70 ? 'var(--primaria)' : planta.saude >= 40 ? 'var(--aviso)' : 'var(--erro)'
  const [incrementoEscolhido, setIncrementoEscolhido] = useState<number>(INCREMENTOS_VASO_CM[0])
  const [agora, setAgora] = useState(() => Date.now())

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
          <img className="planta-stage__imagem" src={imagem.url} alt={imagem.rotulo ?? especieNome} loading="lazy" draggable={false} />
        )}
        {imagem.rotulo && (
          <span className={`imagem-badge imagem-badge--${imagem.motivo}`}>
            {imagem.motivo === 'praga' ? '🐛' : '💧'} {imagem.rotulo}
          </span>
        )}
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

        <div className="barra-saude">
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
              <button onClick={onRegar}>💧 Regar</button>
              <select value={planta.posicaoSol} onChange={(e) => onMudarSol(e.target.value as NivelLuz)}>
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
                    +{cm}cm ({custoTransplante(cm)}🪙)
                  </option>
                ))}
              </select>
              <button onClick={() => onTransplantar(incrementoEscolhido)}>🪴 Transplantar</button>
              <button className="acao-btn--vender" onClick={onVender}>
                💰 Vender
              </button>
            </div>
            {planta.estado === 'praga' && (
              <div className="acoes-linha">
                <button className="acao-btn--praga" onClick={onTratarPraga}>
                  🧪 Tratar grátis ({Math.round(CHANCE_SUCESSO_TRATAMENTO_MANUAL * 100)}%)
                </button>
                {remedioDisponivel && (
                  <button className="acao-btn--remedio" onClick={() => onComprarRemedio(remedioDisponivel.id!)}>
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
