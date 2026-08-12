import { useEffect, useState, useCallback } from 'react'
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
import { PlantCard } from './PlantCard'

export function GardenView() {
  const [plantas, setPlantas] = useState<PlantaComEspecie[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [sementes, setSementes] = useState<ItemLoja[]>([])
  const [remedios, setRemedios] = useState<ItemLoja[]>([])
  const [jogador, setJogador] = useState<Jogador | undefined>(undefined)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    await processarTodasAsPlantas()
    setPlantas(await listarPlantasComEspecie())
    setJogador(await obterJogador())
  }, [])

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
    return () => document.removeEventListener('visibilitychange', aoFicarVisivel)
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

  return (
    <>
      <div className="app-header">
        <h1>🌿 Jardim</h1>
        <span className="coin-pill">🪙 {jogador?.moeda ?? 0}</span>
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

      <div className="secao">
        <div className="secao__titulo">O teu jardim ({plantas.length})</div>
        {plantas.length === 0 && <p className="vazio">Ainda não tens plantas -- planta uma semente acima.</p>}
        <div className="jardim-grid">
          {plantas.map(({ planta, especieNome, especie }) => (
            <PlantCard
              key={planta.id}
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
          ))}
        </div>
      </div>
    </>
  )
}
