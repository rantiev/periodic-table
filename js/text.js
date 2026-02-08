import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

let font = null

export const setFont = (loadedFont) => {
  font = loadedFont
}

export const getFont = () => font

export const create3DText = (text, size, depth = 0.1, simple = false) => {
  if (!font) return null
  
  const textGeometry = new TextGeometry(text, {
    font: font,
    size: size,
    height: depth,
    curveSegments: 12,
    bevelEnabled: !simple,
    bevelThickness: simple ? 0 : 0.02,
    bevelSize: simple ? 0 : 0.01,
    bevelSegments: simple ? 0 : 3
  })
  
  textGeometry.computeBoundingBox()
  const textMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2
  })
  
  const textMesh = new THREE.Mesh(textGeometry, textMaterial)
  const bbox = textGeometry.boundingBox
  const centerX = (bbox.min.x + bbox.max.x) / 2
  const centerY = (bbox.min.y + bbox.max.y) / 2
  textMesh.position.x = -centerX
  textMesh.position.y = -centerY
  
  return textMesh
}
