import { useEffect, useState, useCallback, useRef } from 'react'
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
import { Scene } from '../three/Scene'
import { VirtualJoystick } from '../three/VirtualJoystick'
import { PlantActionSheet } from './PlantActionSheet'
import { ShopSheet } from './ShopSheet'
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
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null)
  const [lojaAberta, setLojaAberta] = useState(false)
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

  function selecionarPlanta(id: number | null) {
    setSelecionadaId(id)
  }

  const selecionada = plantas.find(({ planta }) => planta.id === selecionadaId)

  return (
    <div className="jardim-3d-shell">
      <Scene plantas={plantas} onSelecionarPlanta={selecionarPlanta} />
      <VirtualJoystick />

      <div className="hud">
        <div className="app-header hud__topo">
          <div className="marca">
            <Folha tamanho={34} />
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
            <button className="chip" onClick={() => setLojaAberta(true)}>
              🛒 Loja
            </button>
            <span className="coin-pill">🪙 {jogador?.moeda ?? 0}</span>
          </div>
        </div>

        {mensagem && <div className="mensagem-toast hud__toast">{mensagem}</div>}
      </div>

      <ShopSheet
        aberto={lojaAberta}
        onFechar={() => setLojaAberta(false)}
        especies={especies}
        sementes={sementes}
        onPlantar={plantar}
        onComprarSemente={comprarSemente}
      />

      {selecionada && (
        <PlantActionSheet
          planta={selecionada.planta}
          especieNome={selecionada.especieNome}
          especie={selecionada.especie}
          onFechar={() => setSelecionadaId(null)}
          onRegar={async () => {
            await regarPlanta(selecionada.planta.id!)
            await recarregar()
          }}
          onMudarSol={async (posicao: NivelLuz) => {
            await mudarPosicaoSol(selecionada.planta.id!, posicao)
            await recarregar()
          }}
          onTransplantar={async (incrementoCm: number) => {
            const resultado = await transplantarVaso(selecionada.planta.id!, incrementoCm)
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
            await recarregar()
          }}
        />
      )}
    </div>
  )
}
