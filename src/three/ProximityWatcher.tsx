import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { LocalizacaoPlanta } from '../game/layout'
import { RAIO_HISTERESE, RAIO_PROXIMIDADE } from './movement'

interface Props {
  avatarRef: React.RefObject<THREE.Group | null>
  localizacoes: LocalizacaoPlanta[]
  /** chamado com o id da planta ao entrar em proximidade, ou null ao sair -- so quando muda. */
  onProximidade: (id: number | null) => void
}

const INTERVALO_VERIFICACAO = 1 / 10 // ~10Hz, nao precisa de ser todos os frames

/**
 * Deteta "andar ate perto de uma planta sem tocar" -- forca bruta sobre
 * ate 50 plantas e suficiente a esta escala, nao precisa de spatial hash.
 * So aciona a abertura automatica; uma planta selecionada por tap fica
 * selecionada mesmo fora do raio (ver GardenView -- so este watcher chama
 * onProximidade(null), a selecao por tap so fecha pelo botao fechar).
 */
export function ProximityWatcher({ avatarRef, localizacoes, onProximidade }: Props) {
  const atual = useRef<number | null>(null)
  const acumulador = useRef(0)

  useFrame((_, delta) => {
    acumulador.current += delta
    if (acumulador.current < INTERVALO_VERIFICACAO) return
    acumulador.current = 0

    const avatar = avatarRef.current
    if (!avatar) return
    const pos = avatar.position

    if (atual.current !== null) {
      const perto = localizacoes.find((l) => l.id === atual.current)
      if (perto) {
        const dist = Math.hypot(pos.x - perto.x, pos.z - perto.z)
        if (dist <= RAIO_HISTERESE) return // continua perto, nada muda
      }
      atual.current = null
      onProximidade(null)
    }

    let maisProxima: LocalizacaoPlanta | null = null
    let menorDist = Infinity
    for (const loc of localizacoes) {
      const dist = Math.hypot(pos.x - loc.x, pos.z - loc.z)
      if (dist < menorDist) {
        menorDist = dist
        maisProxima = loc
      }
    }
    if (maisProxima && menorDist <= RAIO_PROXIMIDADE) {
      atual.current = maisProxima.id
      onProximidade(maisProxima.id)
    }
  })

  return null
}
