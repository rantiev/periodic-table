import * as THREE from 'three'

export const createScene = () => {
  const scene = new THREE.Scene()
  return scene
}

export const createCamera = (getContainerWidth) => {
  const camera = new THREE.PerspectiveCamera(75, getContainerWidth() / window.innerHeight, 0.1, 1000)
  return camera
}

export const createRenderer = (getContainerWidth) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(getContainerWidth(), window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  document.getElementById('container').appendChild(renderer.domElement)
  return renderer
}

export const setupLights = (scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight1.position.set(5, 5, 5)
  scene.add(directionalLight1)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight2.position.set(-5, -5, -5)
  scene.add(directionalLight2)
}

export const calculateCameraDistance = (group, camera, getContainerWidth) => {
  const boundingBox = new THREE.Box3().setFromObject(group)
  const size = boundingBox.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y)
  const margin = 40
  const containerWidth = getContainerWidth()
  const availableWidth = containerWidth - (margin * 2)
  const availableHeight = window.innerHeight - (margin * 2)
  const fov = camera.fov * (Math.PI / 180)
  
  const widthFit = (maxDim / 2) / Math.tan(fov / 2) * (containerWidth / availableWidth) * 0.75
  const heightFit = (maxDim / 2) / Math.tan(fov / 2) * (window.innerHeight / availableHeight) * 0.75
  const distance = Math.min(widthFit, heightFit)
  
  return distance
}
