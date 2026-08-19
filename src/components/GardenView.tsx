import { useEffect, useState, useCallback, useRef } from 'react'
import { db } from '../db/schema'
import type { Especie, ItemLoja, Jogador, NivelLuz, SementeInventario, TipoVaso, VasoPossuido } from '../db/schema'
import {
  colocarVasoNaParcela,
  comprarETratarComRemedio,
  comprarSemente,
  ganharSementeGratis,
  listarInventarioSementes,
  listarLoja,
  listarPlantasComEspecie,
  listarVasos,
  mudarPosicaoSol,
  obterJogador,
  plantarNoVaso,
  processarTodasAsPlantas,
  regarPlanta,
  transplantarVaso,
  tratarPragaManual,
  venderPlanta,
  type PlantaComEspecie,
} from '../db/actions'
import { detetarProblemas } from '../game/notificacoes'
import { calcularNivel } from '../game/nivel'
import { GardenScene, type AcoesRapidasPlanta } from '../garden/GardenScene'
import { VirtualJoystick } from '../garden/VirtualJoystick'
import { dispararAcaoAvatar } from '../garden/movement'
import { PlantActionSheet } from './PlantActionSheet'
import { ShopSheet } from './ShopSheet'
import { PotPickerSheet } from './PotPickerSheet'
import { SeedPickerSheet } from './SeedPickerSheet'
import { Folha } from './Folha'

const INTERVALO_VERIFICACAO_MS = 5 * 60_000 // verifica problemas a cada 5 min enquanto a app estiver aberta
const ORDEM_LUZ: NivelLuz[] = ['sombra', 'sombra_parcial', 'sol_parcial', 'sol_pleno']

function podeNotificar() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function GardenView() {
  const [plantas, setPlantas] = useState<PlantaComEspecie[]>([])
  const [vasos, setVasos] = useState<VasoPossuido[]>([])
  const [inventario, setInventario] = useState<SementeInventario[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [sementes, setSementes] = useState<ItemLoja[]>([])
  const [remedios, setRemedios] = useState<ItemLoja[]>([])
  const [jogador, setJogador] = useState<Jogador | undefined>(undefined)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [lojaAberta, setLojaAberta] = useState(false)
  const [parcelaEmEscolha, setParcelaEmEscolha] = useState<number | null>(null)
  const [vasoEmEscolha, setVasoEmEscolha] = useState<number | null>(null)
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState<NotificationPermission | 'indisponivel'>(
    podeNotificar() ? Notification.permission : 'indisponivel',
  )
  const jaNotificados = useRef<Set<string>>(new Set())
  const [moedaPop, setMoedaPop] = useState(false)
  const moedaAnterior = useRef<number | undefined>(undefined)

  const recarregar = useCallback(async () => {
    await processarTodasAsPlantas()
    const [lista, listaVasos, listaInventario] = await Promise.all([
      listarPlantasComEspecie(),
      listarVasos(),
      listarInventarioSementes(),
    ])
    setPlantas(lista)
    setVasos(listaVasos)
    setInventario(listaInventario)
    setJogador(await obterJogador())

    if (podeNotificar() && Notification.permission === 'granted') {
      const problemas = detetarProblemas(lista, Date.now())
      for (const problema of problemas) {
        if (jaNotificados.current.has(problema.chave)) continue
        jaNotificados.current.add(problema.chave)
        new Notification(problema.titulo, { body: problema.corpo })
      }
      const chavesAtuais = new Set(problemas.map((p) => p.chave))
      for (const chave of jaNotificados.current) {
        if (!chavesAtuais.has(chave)) jaNotificados.current.delete(chave)
      }
    }
  }, [])

  async function ativarNotificacoes() {
    if (!podeNotificar()) return
    const resultado = await Notification.requestPermission()
    setPermissaoNotificacoes(resultado)
  }

  useEffect(() => {
    db.especies.toArray().then(setEspecies)
    listarLoja().then((itens) => {
      setSementes(itens.filter((i) => i.tipo === 'semente'))
      setRemedios(itens.filter((i) => i.tipo === 'remedio'))
    })
    recarregar()

    const aoFicarVisivel = () => {
      if (document.visibilityState === 'visible') recarregar()
    }
    document.addEventListener('visibilitychange', aoFicarVisivel)
    const intervalo = setInterval(recarregar, INTERVALO_VERIFICACAO_MS)

    return () => {
      document.removeEventListener('visibilitychange', aoFicarVisivel)
      clearInterval(intervalo)
    }
  }, [recarregar])

  useEffect(() => {
    if (jogador === undefined) return
    if (moedaAnterior.current !== undefined && jogador.moeda > moedaAnterior.current) {
      setMoedaPop(true)
      const t = setTimeout(() => setMoedaPop(false), 450)
      moedaAnterior.current = jogador.moeda
      return () => clearTimeout(t)
    }
    moedaAnterior.current = jogador.moeda
  }, [jogador])

  function avisar(texto: string) {
    setMensagem(texto)
    setTimeout(() => setMensagem((atual) => (atual === texto ? null : atual)), 4000)
  }

  async function ganharGratis(speciesId: string) {
    await ganharSementeGratis(speciesId)
    avisar('Semente adicionada ao inventário -- planta-a num vaso vazio 🌱')
    await recarregar()
  }

  async function comprarSementeLoja(itemId: number) {
    const resultado = await comprarSemente(itemId)
    if (!resultado.ok) avisar(resultado.erro)
    else avisar('Semente comprada -- planta-a num vaso vazio 🌱')
    await recarregar()
  }

  function selecionarPlanta(id: number | null) {
    setSelecionadaId(id)
    if (id === null) setDetalhesAbertos(false)
  }

  async function colocarVaso(tipo: TipoVaso, cor: string) {
    if (parcelaEmEscolha === null) return
    const resultado = await colocarVasoNaParcela(parcelaEmEscolha, tipo, cor)
    if (!resultado.ok) avisar(resultado.erro)
    setParcelaEmEscolha(null)
    await recarregar()
  }

  async function plantarSementeEscolhida(speciesId: string) {
    if (vasoEmEscolha === null) return
    dispararAcaoAvatar('plantar')
    const resultado = await plantarNoVaso(vasoEmEscolha, speciesId)
    if (!resultado.ok) avisar(resultado.erro)
    setVasoEmEscolha(null)
    await recarregar()
  }

  const selecionada = plantas.find(({ planta }) => planta.id === selecionadaId)
  const vasoDaSelecionada = vasos.find((v) => v.plantaId === selecionadaId)
  const infoNivel = calcularNivel(jogador?.totalColhidas ?? 0)

  const acoesRapidas: AcoesRapidasPlanta = {
    onRegar: async (id) => {
      await regarPlanta(id)
      await recarregar()
    },
    onCiclarSol: async (id) => {
      const item = plantas.find((p) => p.planta.id === id)
      if (!item) return
      const proximo = ORDEM_LUZ[(ORDEM_LUZ.indexOf(item.planta.posicaoSol) + 1) % ORDEM_LUZ.length]
      await mudarPosicaoSol(id, proximo)
      await recarregar()
    },
    onTratarPraga: async (id) => {
      const resultado = await tratarPragaManual(id)
      avisar(resultado.sucesso ? 'Tratamento resultou! 🌿' : 'O tratamento falhou desta vez -- tenta outra vez ou compra um remédio.')
      await recarregar()
    },
    onVender: async (id) => {
      const resultado = await venderPlanta(id)
      if (resultado.ok) avisar(`Vendida por ${resultado.ganho}🪙`)
      else avisar(resultado.erro)
      setSelecionadaId(null)
      await recarregar()
    },
    onAbrirDetalhes: (_id) => {
      setDetalhesAbertos(true)
    },
  }

  return (
    <div className="jardim-shell">
      <GardenScene
        plantas={plantas}
        vasos={vasos}
        selecionadaId={selecionadaId}
        onSelecionarPlanta={selecionarPlanta}
        onAbrirVasoVazio={(vasoId) => setVasoEmEscolha(vasoId)}
        onAbrirParcelaVazia={(slotIndex) => setParcelaEmEscolha(slotIndex)}
        acoes={acoesRapidas}
      />
      <VirtualJoystick />

      <div className="hud">
        <div className="app-header hud__topo">
          <div className="marca">
            <Folha tamanho={34} />
            <div className="marca__texto">
              <h1>Between Leaves</h1>
              <div className="nivel-badge" title={`${infoNivel.progresso}/5 colheitas para o nível ${infoNivel.nivel + 1}`}>
                <span className="nivel-badge__rotulo">Nível {infoNivel.nivel}</span>
                <span className="nivel-badge__barra">
                  <span className="nivel-badge__preenchimento" style={{ width: `${(infoNivel.progresso / 5) * 100}%` }} />
                </span>
              </div>
            </div>
          </div>
          <div className="hud__acoes-topo">
            {permissaoNotificacoes === 'default' && (
              <button className="botao-icone" onClick={ativarNotificacoes} aria-label="Ativar avisos" title="Ativar avisos">
                🔔
              </button>
            )}
            {permissaoNotificacoes === 'denied' && (
              <span className="botao-icone botao-icone--mudo" title="Notificações bloqueadas nas definições do browser">
                🔕
              </span>
            )}
            {permissaoNotificacoes === 'granted' && (
              <span className="botao-icone botao-icone--ativo" title="Avisos ativos">
                🔔
              </span>
            )}
            {inventario.some((i) => i.quantidade > 0) && (
              <span className="coin-pill coin-pill--sementes" title="Sementes por plantar -- toca num vaso vazio no jardim">
                🌱 {inventario.reduce((total, i) => total + i.quantidade, 0)}
              </span>
            )}
            <span className={`coin-pill ${moedaPop ? 'coin-pill--pop' : ''}`}>
              <span className="coin-pill__moeda">🪙</span> {jogador?.moeda ?? 0}
            </span>
          </div>
        </div>

        {mensagem && <div className="mensagem-toast hud__toast">{mensagem}</div>}

        <div className="hud__toolbar">
          <button className="botao-ferramenta" onClick={() => setLojaAberta(true)}>
            <span className="botao-ferramenta__icone">🛒</span>
            <span className="botao-ferramenta__rotulo">Loja</span>
          </button>
        </div>
      </div>

      <ShopSheet
        aberto={lojaAberta}
        onFechar={() => setLojaAberta(false)}
        especies={especies}
        sementes={sementes}
        onGanharSementeGratis={ganharGratis}
        onComprarSemente={comprarSementeLoja}
      />

      <PotPickerSheet aberto={parcelaEmEscolha !== null} onFechar={() => setParcelaEmEscolha(null)} onConfirmar={colocarVaso} />

      <SeedPickerSheet
        aberto={vasoEmEscolha !== null}
        onFechar={() => setVasoEmEscolha(null)}
        inventario={inventario}
        especies={especies}
        onPlantar={plantarSementeEscolhida}
      />

      {selecionada && detalhesAbertos && (
        <PlantActionSheet
          planta={selecionada.planta}
          especieNome={selecionada.especieNome}
          especie={selecionada.especie}
          vasoAtual={vasoDaSelecionada}
          onFechar={() => setDetalhesAbertos(false)}
          onRegar={async () => {
            await regarPlanta(selecionada.planta.id!)
            await recarregar()
          }}
          onMudarSol={async (posicao: NivelLuz) => {
            await mudarPosicaoSol(selecionada.planta.id!, posicao)
            await recarregar()
          }}
          onTransplantar={async (incrementoCm: number, novoTipo: TipoVaso, novaCor: string) => {
            const resultado = await transplantarVaso(selecionada.planta.id!, incrementoCm, novoTipo, novaCor)
            if (!resultado.ok) avisar(resultado.erro)
            await recarregar()
          }}
          onTratarPraga={async () => {
            const resultado = await tratarPragaManual(selecionada.planta.id!)
            avisar(resultado.sucesso ? 'Tratamento resultou! 🌿' : 'O tratamento falhou desta vez -- tenta outra vez ou compra um remédio.')
            await recarregar()
          }}
          remedioDisponivel={remedios.find((r) => r.pragaAlvo === selecionada.planta.pragaAtual)}
          onComprarRemedio={async (itemId: number) => {
            const resultado = await comprarETratarComRemedio(itemId, selecionada.planta.id!)
            if (resultado.ok) avisar('Remédio aplicado, praga tratada garantidamente! 🧪')
            else avisar(resultado.erro)
            await recarregar()
          }}
          onVender={async () => {
            const resultado = await venderPlanta(selecionada.planta.id!)
            if (resultado.ok) avisar(`Vendida por ${resultado.ganho}🪙`)
            else avisar(resultado.erro)
            setSelecionadaId(null)
            setDetalhesAbertos(false)
            await recarregar()
          }}
        />
      )}
    </div>
  )
}
