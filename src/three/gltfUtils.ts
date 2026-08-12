import * as THREE from 'three'

/**
 * Os modelos da Kenney com mais de um material (vaso, flores) sao partidos
 * pelo GLTFLoader num Mesh filho por material, dentro de um Group vazio
 * com o nome original do node (sem geometria propria nesse Group). Por
 * isso e preciso apanhar os Mesh filhos reais, nao o node "pai" do drei
 * `nodes`.
 */
export function submeshesDoNo(no: THREE.Object3D | undefined): THREE.Mesh[] {
  if (!no) return []
  if ((no as THREE.Mesh).isMesh) return [no as THREE.Mesh]
  return no.children.filter((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh)
}
