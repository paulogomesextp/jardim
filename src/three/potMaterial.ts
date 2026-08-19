import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Material PBR partilhado do vaso (ambientCG "Clay004", CC0, ver
 * public/textures/LICENSE.txt) -- uma unica instancia de
 * MeshStandardMaterial reutilizada em todos os vasos do jardim, texturas
 * carregadas uma vez so (mesmo padrao nao-suspensivo do textureCache.ts,
 * para nao precisar de <Suspense> a volta do Canvas).
 */
const BASE = `${import.meta.env.BASE_URL}textures/clay/`

// color multiplica a textura de barro real -- leve tint quente/saturado
// (em vez de 0xffffff neutro) para um terracota mais vivo, missao FarmVille
const material = new THREE.MeshStandardMaterial({ color: 0xffdcb0, roughness: 1 })
let carregado = false
const ouvintes = new Set<() => void>()

function carregar() {
  if (carregado) return
  carregado = true
  const loader = new THREE.TextureLoader()
  let restantes = 3

  function aoTerminarUm() {
    restantes -= 1
    if (restantes === 0) {
      material.needsUpdate = true
      for (const ouvir of ouvintes) ouvir()
    }
  }

  loader.load(`${BASE}Clay001_1K-JPG_Color.jpg`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    material.map = tex
    aoTerminarUm()
  })
  loader.load(`${BASE}Clay001_1K-JPG_NormalGL.jpg`, (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    material.normalMap = tex
    aoTerminarUm()
  })
  loader.load(`${BASE}Clay001_1K-JPG_Roughness.jpg`, (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    material.roughnessMap = tex
    aoTerminarUm()
  })
}

/** Devolve o material do vaso -- sem mapas na primeira chamada, atualizado (via force-render) assim que as 3 texturas chegarem. */
export function usePotClayMaterial(): THREE.MeshStandardMaterial {
  const [, forcar] = useState(0)
  useEffect(() => {
    carregar()
    const ouvir = () => forcar((n) => n + 1)
    ouvintes.add(ouvir)
    return () => {
      ouvintes.delete(ouvir)
    }
  }, [])
  return material
}
