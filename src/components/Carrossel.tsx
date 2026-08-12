import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface Props<T> {
  itens: T[]
  chave: (item: T) => string | number
  render: (item: T) => ReactNode
}

const LIMIAR_ARRASTO = 0.18 // fracao da largura do carrossel que o dedo tem de percorrer para trocar de planta

/** Carrossel de um item de cada vez, navegavel por arrastar/swipe horizontal, setas ou teclado. */
export function Carrossel<T>({ itens, chave, render }: Props<T>) {
  const [indice, setIndice] = useState(0)
  const [arrasto, setArrasto] = useState(0)
  const emArrasto = useRef(false)
  const inicioX = useRef(0)
  const janelaRef = useRef<HTMLDivElement>(null)

  // se a planta atual for vendida/removida, mantem o indice dentro dos limites
  useEffect(() => {
    setIndice((i) => Math.min(i, Math.max(0, itens.length - 1)))
  }, [itens.length])

  useEffect(() => {
    function aoTeclado(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIndice((i) => Math.min(i + 1, itens.length - 1))
      if (e.key === 'ArrowLeft') setIndice((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', aoTeclado)
    return () => window.removeEventListener('keydown', aoTeclado)
  }, [itens.length])

  function aoPressionar(e: PointerEvent<HTMLDivElement>) {
    emArrasto.current = true
    inicioX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function aoMover(e: PointerEvent<HTMLDivElement>) {
    if (!emArrasto.current) return
    setArrasto(e.clientX - inicioX.current)
  }

  function aoLargar() {
    if (!emArrasto.current) return
    emArrasto.current = false
    const largura = janelaRef.current?.offsetWidth ?? 1
    if (arrasto < -largura * LIMIAR_ARRASTO && indice < itens.length - 1) setIndice((i) => i + 1)
    else if (arrasto > largura * LIMIAR_ARRASTO && indice > 0) setIndice((i) => i - 1)
    setArrasto(0)
  }

  if (itens.length === 0) return null

  return (
    <div className="carrossel">
      <div className="carrossel__janela" ref={janelaRef}>
        <div
          className="carrossel__pista"
          style={{
            transform: `translateX(calc(${-indice * 100}% + ${arrasto}px))`,
            transition: emArrasto.current ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoLargar}
          onPointerCancel={aoLargar}
        >
          {itens.map((item) => (
            <div className="carrossel__slide" key={chave(item)}>
              {render(item)}
            </div>
          ))}
        </div>
      </div>

      {itens.length > 1 && (
        <div className="carrossel__nav">
          <button
            className="carrossel__seta"
            onClick={() => setIndice((i) => Math.max(i - 1, 0))}
            disabled={indice === 0}
            aria-label="Planta anterior"
          >
            ‹
          </button>
          <div className="carrossel__pontos">
            {itens.map((item, i) => (
              <button
                key={chave(item)}
                className={`carrossel__ponto ${i === indice ? 'carrossel__ponto--ativo' : ''}`}
                onClick={() => setIndice(i)}
                aria-label={`Ir para planta ${i + 1} de ${itens.length}`}
              />
            ))}
          </div>
          <button
            className="carrossel__seta"
            onClick={() => setIndice((i) => Math.min(i + 1, itens.length - 1))}
            disabled={indice === itens.length - 1}
            aria-label="Próxima planta"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
