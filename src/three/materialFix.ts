import * as THREE from 'three'

/**
 * Os modelos da Kenney (CC0) vem com metallicFactor:1/roughnessFactor:1 --
 * um truque usado nos exports deles para engines com luz ambiente forte
 * (Unity/Godot), mas em Three.js sem mapa de ambiente (nao usamos, para
 * nao trazer mais uma dependencia/asset HDR) um material metalico sem
 * nada para refletir fica escuro/apagado. Zera o metalness para virar um
 * material difuso normal, que reage bem so com luz ambiente+direcional.
 */
export function desmetalizar(material: THREE.Material | THREE.Material[] | null | undefined) {
  const lista = Array.isArray(material) ? material : material ? [material] : []
  for (const mat of lista) {
    if (mat instanceof THREE.MeshStandardMaterial) mat.metalness = 0
  }
}
