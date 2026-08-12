import { useEffect, useState, useCallback } from 'react'
import { db } from '../db/schema'
import type { Especie, NivelLuz } from '../db/schema'
import {
  aumentarVaso,
  listarPlantasComEspecie,
  mudarPosicaoSol,
  plantarSemente,
  processarTodasAsPlantas,
  regarPlanta,
  type PlantaComEspecie,
} from '../db/actions'
import { PlantCard } from './PlantCard'

export function GardenView() {
  const [plantas, setPlantas] = useState<PlantaComEspecie[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])

  const recarregar = useCallback(async () => {
    await processarTodasAsPlantas()
    setPlantas(await listarPlantasComEspecie())
  }, [])

  useEffect(() => {
    db.especies.toArray().then(setEspecies)
    recarregar()

    // reavalia sempre que a aba volta a ficar visivel -- e assim que o "catch-up" acontece
    const aoFicarVisivel = () => {
      if (document.visibilityState === 'visible') recarregar()
    }
    document.addEventListener('visibilitychange', aoFicarVisivel)
    return () => document.removeEventListener('visibilitychange', aoFicarVisivel)
  }, [recarregar])

  async function plantar(speciesId: string) {
    await plantarSemente(speciesId)
    await recarregar()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Plantar semente nova</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {especies.map((e) => (
            <button key={e.id} onClick={() => plantar(e.id)}>
              🌱 {e.nome}
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
              onAumentarVaso={async () => {
                await aumentarVaso(planta.id!)
                await recarregar()
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
