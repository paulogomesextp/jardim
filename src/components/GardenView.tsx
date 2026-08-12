import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { db } from '../db/schema'
import type { Especie, ItemLoja, Jogador, NivelLuz } from '../db/schema'
import {
  comprarEPlantarSemente,
  comprarETratarComRemedio,
  listarLoja,
  listarPlantasComEspecie,
  mudarPosicaoSol,
  obterJogador,
  plantarSemente,
  processarTodasAsPlantas,
  regarPlanta,
  transplantarVaso,
  tratarPragaManual,
  venderPlanta,
  type PlantaComEspecie,
} from '../db/actions'
import { detetarProblemas } from '../game/notificacoes'
import { proximaRegaInfo } from '../game/temporizadores'
import { PlantStage } from './PlantStage'
import { Carrossel } from './Carrossel'
import { Folha } from './Folha'

const INTERVALO_VERIFICACAO_MS = 5 * 60_000 // verifica problemas a cada 5 min enquanto a app estiver aberta

function podeNotificar() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function GardenView() {
  const [plantas, setPlantas] = useState<PlantaComEspecie[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [sementes, setSementes] = useState<ItemLoja[]>([])
  const [remedios, setRemedios] = useState<ItemLoja[]>([])
  const [jogador, setJogador] = useState<Jogador | undefined>(undefined)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState<NotificationPermission | 'indisponivel'>(
    podeNotificar() ? Notification.permission : 'indisponivel',
  )
  const jaNotificados = useRef<Set<string>>(new Set())

  const recarregar = useCallback(async () => {
    await processarTodasAsPlantas()
    const lista = await listarPlantasComEspecie()
    setPlantas(lista)
    setJogador(await obterJogador())

    if (podeNotificar() && Notification.permission === 'granted') {
      const problemas = detetarProblemas(lista, Date.now())
      for (const problema of problemas) {
        if (jaNotificados.current.has(problema.chave)) continue
        jaNotificados.current.add(problema.chave)
        new Notification(problema.titulo, { body: problema.corpo })
      }
      // limpa da memoria os problemas que ja nao existem, para poderem voltar a notificar se surgirem outra vez
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

    // reavalia sempre que a aba volta a ficar visivel -- e assim que o "catch-up" acontece
    const aoFicarVisivel = () => {
      if (document.visibilityState === 'visible') recarregar()
    }
    document.addEventListener('visibilitychange', aoFicarVisivel)

    // verificacao periodica para notificacoes -- so funciona com a app aberta
    // (sem Push API/service worker nao ha aviso com a app fechada)
    const intervalo = setInterval(recarregar, INTERVALO_VERIFICACAO_MS)

    return () => {
      document.removeEventListener('visibilitychange', aoFicarVisivel)
      clearInterval(intervalo)
    }
  }, [recarregar])

  function avisar(texto: string) {
    setMensagem(texto)
    setTimeout(() => setMensagem((atual) => (atual === texto ? null : atual)), 4000)
  }

  async function plantar(speciesId: string) {
    await plantarSemente(speciesId)
    await recarregar()
  }

  async function comprarSemente(itemId: number) {
    const resultado = await comprarEPlantarSemente(itemId)
    if (!resultado.ok) avisar(resultado.erro)
    await recarregar()
  }

  function renderPlantStage({ planta, especieNome, especie }: PlantaComEspecie) {
    return (
      <PlantStage
        planta={planta}
        especieNome={especieNome}
        especie={especie}
        onRegar={async () => {
          await regarPlanta(planta.id!)
          await recarregar()
        }}
        onMudarSol={async (posicao: NivelLuz) => {
          await mudarPosicaoSol(planta.id!, posicao)
          await recarregar()
        }}
        onTransplantar={async (incrementoCm: number) => {
          const resultado = await transplantarVaso(planta.id!, incrementoCm)
          if (!resultado.ok) avisar(resultado.erro)
          await recarregar()
        }}
        onTratarPraga={async () => {
          const resultado = await tratarPragaManual(planta.id!)
          avisar(resultado.sucesso ? 'Tratamento resultou! 🌿' : 'O tratamento falhou desta vez -- tenta outra vez ou compra um remédio.')
          await recarregar()
        }}
        remedioDisponivel={remedios.find((r) => r.pragaAlvo === planta.pragaAtual)}
        onComprarRemedio={async (itemId: number) => {
          const resultado = await comprarETratarComRemedio(itemId, planta.id!)
          if (resultado.ok) avisar('Remédio aplicado, praga tratada garantidamente! 🧪')
          else avisar(resultado.erro)
          await recarregar()
        }}
        onVender={async () => {
          const resultado = await venderPlanta(planta.id!)
          if (resultado.ok) avisar(`Vendida por ${resultado.ganho}🪙`)
          else avisar(resultado.erro)
          await recarregar()
        }}
      />
    )
  }

  const rebentosIniciais = plantas.filter(({ planta }) => planta.fase === 'rebento')
  const emCrescimento = plantas.filter(({ planta }) => planta.fase === 'jovem' || planta.fase === 'adulta')
  const comProblemas = plantas.filter(({ planta, especie }) => {
    if (planta.estado === 'praga' || planta.estado === 'stress' || planta.estado === 'morta') return true
    return !!especie && proximaRegaInfo(planta, especie, Date.now()).atrasado
  })

  return (
    <>
      <div className="app-header">
        <div className="marca">
          <Folha tamanho={38} />
          <div className="marca__texto">
            <h1>Between Leaves</h1>
            <span className="marca__tagline">A little greener, one leaf at a time.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {permissaoNotificacoes === 'default' && (
            <button className="chip" onClick={ativarNotificacoes}>
              🔔 Ativar avisos
            </button>
          )}
          {permissaoNotificacoes === 'denied' && (
            <span className="badge badge--morta" title="Notificações bloqueadas nas definições do browser">
              🔕 Avisos bloqueados
            </span>
          )}
          {permissaoNotificacoes === 'granted' && <span className="badge badge--fase">🔔 Avisos ativos</span>}
          <span className="coin-pill">🪙 {jogador?.moeda ?? 0}</span>
        </div>
      </div>

      {mensagem && <div className="mensagem-toast">{mensagem}</div>}

      <div className="secao">
        <div className="secao__titulo">Plantar semente nova (grátis, para testes)</div>
        <div className="chip-row">
          {especies.map((e) => (
            <button key={e.id} className="chip" onClick={() => plantar(e.id)}>
              🌱 {e.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="secao">
        <div className="secao__titulo">Loja de sementes</div>
        <div className="chip-row">
          {sementes.map((item) => (
            <button key={item.id} className="chip" onClick={() => comprarSemente(item.id!)}>
              🛒 {item.nome} — {item.preco}🪙
            </button>
          ))}
        </div>
      </div>

      <SecaoJardim titulo="Rebentos Iniciais" itens={rebentosIniciais} mensagemVazia="Nenhum rebento inicial neste momento." render={renderPlantStage} />
      <SecaoJardim titulo="Plantas em Crescimento" itens={emCrescimento} mensagemVazia="Nenhuma planta em crescimento neste momento." render={renderPlantStage} />
      <SecaoJardim titulo="Plantas com Doenças" itens={comProblemas} mensagemVazia="Nenhuma planta com problemas -- tudo saudável! 🌿" render={renderPlantStage} />
      <SecaoJardim titulo="Todas as Plantas" itens={plantas} mensagemVazia="Ainda não tens plantas -- planta uma semente acima." render={renderPlantStage} />
    </>
  )
}

interface SecaoJardimProps {
  titulo: string
  itens: PlantaComEspecie[]
  mensagemVazia: string
  render: (item: PlantaComEspecie) => ReactNode
}

function SecaoJardim({ titulo, itens, mensagemVazia, render }: SecaoJardimProps) {
  return (
    <div className="secao secao--jardim">
      <div className="secao__titulo">
        {titulo} ({itens.length})
      </div>
      {itens.length === 0 && <p className="vazio">{mensagemVazia}</p>}
      <Carrossel itens={itens} chave={({ planta }) => planta.id!} render={render} />
    </div>
  )
}
