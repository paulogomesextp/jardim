import { useEffect, useState, useCallback } from 'react'
import { db } from '../db/schema'
import type { Especie, ItemLoja, Jogador, NivelLuz } from '../db/schema'
import {
  comprarEPlantarSemente,
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
  const [loja, setLoja] = useState<ItemLoja[]>([])
  const [jogador, setJogador] = useState<Jogador | undefined>(undefined)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    await processarTodasAsPlantas()
    setPlantas(await listarPlantasComEspecie())
    setJogador(await obterJogador())
  }, [])

  useEffect(() => {
    db.especies.toArray().then(setEspecies)
    listarLoja().then((itens) => setLoja(itens.filter((i) => i.tipo === 'semente')))
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontWeight: 600 }}>🪙 {jogador?.moeda ?? 0} moedas</div>

      {mensagem && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 8, fontSize: 13 }}>
          {mensagem}
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Plantar semente nova (grátis, para testes)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {especies.map((e) => (
            <button key={e.id} onClick={() => plantar(e.id)}>
              🌱 {e.nome}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Loja de sementes</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {loja.map((item) => (
            <button key={item.id} onClick={() => comprarSemente(item.id!)}>
              🛒 {item.nome} — {item.preco}🪙
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>O teu jardim ({plantas.length})</h2>
        {plantas.length === 0 && <p style={{ color: '#64748B' }}>Ainda não tens plantas -- planta uma semente acima.</p>}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {plantas.map(({ planta, especieNome }) => (
            <PlantCard
              key={planta.id}
              planta={planta}
              especieNome={especieNome}
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
                await tratarPragaManual(planta.id!)
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
    </div>
  )
}
