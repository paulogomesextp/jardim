import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Cache module-level de texturas remotas (fotos do Wikimedia) + hook que
 * carrega uma vez e forca re-render so quando a textura chega -- evita
 * Suspense/refetch por planta. Como imagemPlanta.ts reutiliza um pool
 * pequeno de URLs partilhado entre as 50 plantas (~25-32 distintos, nao
 * 50), o cache dedupe naturalmente sem precisar de fila/throttle.
 */
const cache = new Map<string, THREE.Texture>()
const emCarregamento = new Set<string>()
const loader = new THREE.TextureLoader()
loader.crossOrigin = 'anonymous'
const ouvintes = new Set<() => void>()

function avisarOuvintes() {
  for (const ouvir of ouvintes) ouvir()
}

export function useRemoteTexture(url: string | null): THREE.Texture | null {
  const [, forcar] = useState(0)

  useEffect(() => {
    if (!url || cache.has(url) || emCarregamento.has(url)) return
    emCarregamento.add(url)
    loader.load(
      url,
      (textura) => {
        textura.colorSpace = THREE.SRGBColorSpace
        cache.set(url, textura)
        emCarregamento.delete(url)
        avisarOuvintes()
      },
      undefined,
      () => {
        // falha (CORS/rede) -- fica sem textura, Plant3D usa a esfera placeholder
        emCarregamento.delete(url)
      },
    )
  }, [url])

  useEffect(() => {
    const ouvir = () => forcar((n) => n + 1)
    ouvintes.add(ouvir)
    return () => {
      ouvintes.delete(ouvir)
    }
  }, [])

  return url ? (cache.get(url) ?? null) : null
}
