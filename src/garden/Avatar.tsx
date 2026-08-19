import { useEffect, useRef, useState } from 'react'
import { avatarPos, inputParaMundo, inputVector, moveTarget, ouvirAcaoAvatar, VELOCIDADE_AVATAR, type AcaoAvatar } from './movement'
import { mundoParaEcra, profundidade } from './iso'

interface Props {
  limites: { minX: number; maxX: number; minZ: number; maxZ: number }
}

const PASSO_MAX_DELTA = 0.05 // segundos -- protege contra saltos gigantes se a aba ficou em segundo plano

/**
 * Avatar do jardim, agora um "boneco" 100% DOM/CSS (divs + `border-radius`,
 * nenhum `.glb`/WebGL) em vez do modelo Kenney 3D anterior -- ver decisão
 * de arquitetura no README. Move-se por `requestAnimationFrame` puro (sem
 * `useFrame`/R3F): a posição é escrita em `avatarPos` (módulo partilhado,
 * não React state) e no `style.transform` do próprio nó DOM a cada frame,
 * para nunca forçar 60 re-renders/seg da árvore React -- só `aAndar`/
 * `faceEsquerda` (para a animação de caminhar e o espelhar horizontal)
 * passam por `useState`, e só mudam de valor ocasionalmente.
 *
 * Isto substitui `three/Avatar.tsx` -- mesma prioridade de input (teclado/
 * joystick > alvo de tap-to-move), mesmos limites do jardim, mesma
 * velocidade (`VELOCIDADE_AVATAR`).
 */
export function Avatar({ limites }: Props) {
  const raizRef = useRef<HTMLDivElement>(null)
  const limitesRef = useRef(limites)
  const aAndarRef = useRef(false)
  const faceEsquerdaRef = useRef(false)
  const [aAndar, setAAndar] = useState(false)
  const [faceEsquerda, setFaceEsquerda] = useState(false)
  const [acao, setAcao] = useState<AcaoAvatar>(null)

  useEffect(() => {
    limitesRef.current = limites
  }, [limites])

  // acao em curso (regar/tratar/vender/plantar) -- disparada pelo balao de
  // fala (PlantSpeechMenu.tsx) via `dispararAcaoAvatar`, ver movement.ts
  useEffect(() => ouvirAcaoAvatar(setAcao), [])

  useEffect(() => {
    let anterior = performance.now()
    let idFrame: number

    function passo(agora: number) {
      const delta = Math.min((agora - anterior) / 1000, PASSO_MAX_DELTA)
      anterior = agora

      let andou = false
      let dx = 0
      let dz = 0

      const magnitudeInput = Math.hypot(inputVector.x, inputVector.z)
      if (magnitudeInput > 0.05) {
        moveTarget.current = null
        const { dx: idx, dz: idz } = inputParaMundo(inputVector.x, inputVector.z)
        const norm = Math.hypot(idx, idz) || 1
        dx = (idx / norm) * VELOCIDADE_AVATAR * delta
        dz = (idz / norm) * VELOCIDADE_AVATAR * delta
        andou = true
      } else if (moveTarget.current) {
        const alvo = moveTarget.current
        const rx = alvo.x - avatarPos.x
        const rz = alvo.z - avatarPos.z
        const distancia = Math.hypot(rx, rz)
        if (distancia < 0.05) {
          moveTarget.current = null
        } else {
          const passoDist = Math.min(VELOCIDADE_AVATAR * delta, distancia)
          dx = (rx / distancia) * passoDist
          dz = (rz / distancia) * passoDist
          andou = true
        }
      }

      if (andou) {
        const lim = limitesRef.current
        avatarPos.x = Math.min(lim.maxX, Math.max(lim.minX, avatarPos.x + dx))
        avatarPos.z = Math.min(lim.maxZ, Math.max(lim.minZ, avatarPos.z + dz))

        if (Math.abs(dx) > 0.001) {
          const novaFace = dx < 0
          if (novaFace !== faceEsquerdaRef.current) {
            faceEsquerdaRef.current = novaFace
            setFaceEsquerda(novaFace)
          }
        }
      }

      const raiz = raizRef.current
      if (raiz) {
        const { left, top } = mundoParaEcra(avatarPos.x, avatarPos.z)
        raiz.style.transform = `translate(${left}px, ${top}px) translate(-50%, -100%)`
        // mesma escala/arredondamento de z-index que PlantSprite.tsx usa para
        // profundidade -- assim o avatar entra e sai de tras de um vaso
        // corretamente conforme anda, em vez de ficar sempre por cima
        raiz.style.zIndex = String(Math.round(profundidade(avatarPos.x, avatarPos.z) * 10))
      }

      if (andou !== aAndarRef.current) {
        aAndarRef.current = andou
        setAAndar(andou)
      }

      idFrame = requestAnimationFrame(passo)
    }

    idFrame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(idFrame)
  }, [])

  const inicial = mundoParaEcra(avatarPos.x, avatarPos.z)

  return (
    <div
      ref={raizRef}
      className="avatar-raiz"
      style={{ transform: `translate(${inicial.left}px, ${inicial.top}px) translate(-50%, -100%)` }}
    >
      <div className={`avatar ${aAndar ? 'avatar--anda' : ''} ${acao ? `avatar--acao-${acao}` : ''}`}>
        <div className="avatar__sombra" />
        <div className={`avatar__flip ${faceEsquerda ? 'avatar__flip--esquerda' : ''}`}>
          <div className="avatar__grupo">
            <div className="avatar__perna avatar__perna--tras" />
            <div className="avatar__perna avatar__perna--frente" />
            <div className="avatar__corpo">
              <div className="avatar__braco avatar__braco--tras" />
              <div className="avatar__peito" />
              <div className="avatar__braco avatar__braco--frente">
                {acao === 'regar' && (
                  <div className="avatar__regador" aria-hidden="true">
                    <span className="avatar__regador-gota avatar__regador-gota--1" />
                    <span className="avatar__regador-gota avatar__regador-gota--2" />
                    <span className="avatar__regador-gota avatar__regador-gota--3" />
                  </div>
                )}
              </div>
            </div>
            <div className="avatar__cabeca">
              <span className="avatar__olho avatar__olho--esq" />
              <span className="avatar__olho avatar__olho--dir" />
              <div className="avatar__chapeu">
                <div className="avatar__chapeu-aba" />
                <div className="avatar__chapeu-copa" />
              </div>
            </div>
          </div>
        </div>
        {acao === 'tratar' && (
          <div className="avatar__faiscas" aria-hidden="true">
            <span>✨</span>
            <span>✨</span>
            <span>✨</span>
          </div>
        )}
        {acao === 'vender' && (
          <span className="avatar__moeda-voo" aria-hidden="true">
            🪙
          </span>
        )}
        {acao === 'plantar' && (
          <span className="avatar__semente-voo" aria-hidden="true">
            🌱
          </span>
        )}
        {acao === 'sol' && (
          <span className="avatar__sol-voo" aria-hidden="true">
            ☀️
          </span>
        )}
      </div>
    </div>
  )
}
