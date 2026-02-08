import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { elements } from './elements.js'
import { createScene, createCamera, createRenderer, setupLights, calculateCameraDistance } from './scene.js'
import { setFont } from './text.js'
import { createElementBox } from './element.js'
import { addRowColumnLabels } from './labels.js'
import { setupInteractions } from './interactions.js'
import { showElementInfo, createLegend } from './ui.js'

const infoPanelWidth = 310
const getContainerWidth = () => window.innerWidth - infoPanelWidth

const scene = createScene()
const camera = createCamera(getContainerWidth)
const renderer = createRenderer(getContainerWidth)
const group = new THREE.Group()
scene.add(group)

let elementsByCategory = {}

const fontLoader = new FontLoader()
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
  setFont(loadedFont)
  createAllElements()
})

const createAllElements = () => {
  elementsByCategory = {}
  elements.forEach(element => {
    if (element.xpos && element.ypos) {
      const box = createElementBox(element)
      group.add(box)
      
      const category = element.category
      if (!elementsByCategory[category]) {
        elementsByCategory[category] = []
      }
      elementsByCategory[category].push(box)
    }
  })

  group.scale.set(20.0, 20.0, 20.0)

  const boundingBox = new THREE.Box3().setFromObject(group)
  const center = boundingBox.getCenter(new THREE.Vector3())
  group.position.x = -center.x
  group.position.y = -center.y
  
  addRowColumnLabels(group)

  const distance = calculateCameraDistance(group, camera, getContainerWidth)
  camera.position.set(0, 0, distance)
  camera.lookAt(0, 0, 0)
}

setupLights(scene)

const { getActiveElement } = setupInteractions(scene, camera, group, getContainerWidth, showElementInfo)

createLegend(elementsByCategory, getActiveElement)

const handleResize = () => {
  const containerWidth = getContainerWidth()
  camera.aspect = containerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerWidth, window.innerHeight)
  
  const distance = calculateCameraDistance(group, camera, getContainerWidth)
  camera.position.z = distance
  camera.lookAt(0, 0, 0)
}

window.addEventListener('resize', handleResize)

const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

animate()
