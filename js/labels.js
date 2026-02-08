import * as THREE from 'three'
import { create3DText } from './text.js'

export const createLabelCell = (number, x, y) => {
  const geometry = new THREE.BoxGeometry(2.5, 2.5, 0.3)
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    emissive: 0xffffff,
    emissiveIntensity: 0.1
  })
  
  const cellMesh = new THREE.Mesh(geometry, material)
  cellMesh.position.set(x, y, 0)
  
  const edges = new THREE.EdgesGeometry(geometry)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
  })
  const edgesMesh = new THREE.LineSegments(edges, edgeMaterial)
  cellMesh.add(edgesMesh)
  
  const labelText = create3DText(number.toString(), 0.55, 0.12)
  if (labelText) {
    labelText.geometry.computeBoundingBox()
    const bbox = labelText.geometry.boundingBox
    if (bbox) {
      const centerX = (bbox.min.x + bbox.max.x) / 2
      const centerY = (bbox.min.y + bbox.max.y) / 2
      labelText.position.x = -centerX
      labelText.position.y = -centerY
    }
    labelText.position.z = 0.16
    cellMesh.add(labelText)
  }
  
  return cellMesh
}

export const addRowColumnLabels = (group) => {
  const elementSpacing = 3.0
  const elementSize = 2.5
  const gapBetweenElements = elementSpacing - elementSize
  const labelOffset = elementSize / 2 + gapBetweenElements + elementSize / 2
  
  for (let row = 1; row <= 7; row++) {
    const yPos = -(row - 1) * elementSpacing
    const labelCell = createLabelCell(row.toString(), -labelOffset, yPos)
    group.add(labelCell)
  }
  
  const lanthanideY = -6 * elementSpacing - 3.5
  const lanthanideCell = createLabelCell('6', -labelOffset, lanthanideY)
  group.add(lanthanideCell)
  
  const actinideY = -7 * elementSpacing - 3.5
  const actinideCell = createLabelCell('7', -labelOffset, actinideY)
  group.add(actinideCell)
  
  for (let col = 1; col <= 18; col++) {
    const xPos = (col - 1) * elementSpacing
    const labelCell = createLabelCell(col.toString(), xPos, labelOffset)
    group.add(labelCell)
  }
}
