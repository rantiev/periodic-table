import * as THREE from 'three'
import { getCategoryColor, getContrastColor } from './colors.js'
import { create3DText } from './text.js'

export const createElementBox = (element) => {
  const geometry = new THREE.BoxGeometry(2.5, 2.5, 0.3)
  const color = getCategoryColor(element.category)
  const textColor = getContrastColor(color)
  
  const material = new THREE.MeshPhongMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    emissive: color,
    emissiveIntensity: 0.4,
    wireframe: false
  })

  const mesh = new THREE.Mesh(geometry, material)
  let offsetX, offsetY
  
  if (element.ypos === 9) {
    offsetX = (element.xpos - 1) * 3.0
    offsetY = -6 * 3.0 - 3.5
  } else if (element.ypos === 10) {
    offsetX = (element.xpos - 1) * 3.0
    offsetY = -7 * 3.0 - 3.5
  } else {
    offsetX = (element.xpos - 1) * 3.0
    offsetY = -(element.ypos - 1) * 3.0
  }
  
  mesh.position.x = offsetX
  mesh.position.y = offsetY
  mesh.userData = { element, originalScale: 1, isElementBox: true, glowMeshes: [] }

  const edges = new THREE.EdgesGeometry(geometry)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9
  })
  const edgesMesh = new THREE.LineSegments(edges, edgeMaterial)
  mesh.add(edgesMesh)

  const numberText = create3DText(element.number.toString(), 0.35, 0.08)
  if (numberText) {
    numberText.position.x += -0.8
    numberText.position.y += 0.8
    numberText.position.z = 0.16
    numberText.userData = { parentElement: mesh }
    mesh.add(numberText)
  }

  const symbolText = create3DText(element.symbol, 0.55, 0.12)
  if (symbolText) {
    symbolText.position.x += 0
    symbolText.position.y += 0
    symbolText.position.z = 0.16
    symbolText.userData = { parentElement: mesh }
    mesh.add(symbolText)
  }

  const nameText = create3DText(element.name, 0.30, 0.04, true)
  if (nameText) {
    nameText.position.x += 0
    nameText.position.y += -0.8
    nameText.position.z = 0.16
    nameText.userData = { parentElement: mesh }
    mesh.add(nameText)
  }

  return mesh
}
