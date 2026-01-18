import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { elements } from './elements.js'

const scene = new THREE.Scene()
const infoPanelWidth = 310
const getContainerWidth = () => window.innerWidth - infoPanelWidth
const camera = new THREE.PerspectiveCamera(75, getContainerWidth() / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(getContainerWidth(), window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('container').appendChild(renderer.domElement)

const group = new THREE.Group()
scene.add(group)

let font = null
const fontLoader = new FontLoader()
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
  font = loadedFont
  createAllElements()
})

const colors = {
  nonmetal: new THREE.Color(0x4a90e2),
  noble: new THREE.Color(0x9b59b6),
  alkali: new THREE.Color(0xf39c12),
  alkaline: new THREE.Color(0xe67e22),
  transition: new THREE.Color(0xe74c3c),
  metalloid: new THREE.Color(0x3498db),
  postTransition: new THREE.Color(0x1abc9c),
  lanthanide: new THREE.Color(0xf1c40f),
  actinide: new THREE.Color(0xe91e63)
}

const getCategoryColor = (category) => {
  const categoryMap = {
    'nonmetal': colors.nonmetal,
    'noble gas': colors.noble,
    'alkali metal': colors.alkali,
    'alkaline earth metal': colors.alkaline,
    'transition metal': colors.transition,
    'metalloid': colors.metalloid,
    'post-transition metal': colors.postTransition,
    'lanthanide': colors.lanthanide,
    'actinide': colors.actinide
  }
  return categoryMap[category] || colors.nonmetal
}

const getContrastColor = (color) => {
  const r = Math.min(255, color.r * 255 + 100)
  const g = Math.min(255, color.g * 255 + 100)
  const b = Math.min(255, color.b * 255 + 100)
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`
}

const create3DText = (text, size, depth = 0.1, simple = false) => {
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

const createElementBox = (element) => {
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
    offsetX = (element.xpos - 3) * 3.0
    offsetY = -6 * 3.0 - 3.5
  } else if (element.ypos === 10) {
    offsetX = (element.xpos - 3) * 3.0
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
  camera.position.set(0, 0, distance)
  camera.lookAt(0, 0, 0)
}


const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight1.position.set(5, 5, 5)
scene.add(directionalLight1)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
directionalLight2.position.set(-5, -5, -5)
scene.add(directionalLight2)


const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

let hoveredObject = null
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
let activeElement = null
let elementsByCategory = {}
let legendHoveredCategory = null

const addGlowToElement = (elementMesh, animated = false) => {
  if (!elementMesh) return
  
  if (elementMesh.userData.glowMeshes && elementMesh.userData.glowMeshes.length > 0) {
    if (animated) {
      elementMesh.userData.glowMeshes.forEach(glowMesh => {
        if (glowMesh.material) {
          glowMesh.material.opacity = 0
        }
      })
    }
    return
  }
  
  const color = getCategoryColor(elementMesh.userData.element.category)
  
  const glowGeometry = new THREE.BoxGeometry(2.8, 2.8, 0.4)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: animated ? 0 : 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
  glowMesh.position.z = 0.05
  glowMesh.renderOrder = -1
  elementMesh.add(glowMesh)
  if (!elementMesh.userData.glowMeshes) {
    elementMesh.userData.glowMeshes = []
  }
  elementMesh.userData.glowMeshes.push(glowMesh)
  
  const outerGlowGeometry = new THREE.BoxGeometry(3.2, 3.2, 0.5)
  const outerGlowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: animated ? 0 : 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial)
  outerGlowMesh.position.z = 0.08
  outerGlowMesh.renderOrder = -2
  elementMesh.add(outerGlowMesh)
  elementMesh.userData.glowMeshes.push(outerGlowMesh)
  
  if (animated) {
    animateGlowIn(elementMesh.userData.glowMeshes)
  }
}

const animateGlowIn = (glowMeshes) => {
  const duration = 300
  const startTime = Date.now()
  const startOpacity = 0
  const targetOpacities = [0.5, 0.3]
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    glowMeshes.forEach((mesh, index) => {
      if (mesh.material) {
        mesh.material.opacity = startOpacity + (targetOpacities[index] - startOpacity) * easeProgress
      }
    })
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

const animateGlowOut = (glowMeshes, onComplete) => {
  const duration = 300
  const startTime = Date.now()
  const startOpacities = glowMeshes.map(mesh => mesh.material ? mesh.material.opacity : 0)
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    glowMeshes.forEach((mesh, index) => {
      if (mesh.material) {
        mesh.material.opacity = startOpacities[index] * (1 - easeProgress)
      }
    })
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else if (onComplete) {
      onComplete()
    }
  }
  animate()
}

const removeGlowFromElement = (elementMesh, animated = false) => {
  if (!elementMesh || !elementMesh.userData.glowMeshes) return
  
  if (animated && elementMesh.userData.glowMeshes.length > 0) {
    animateGlowOut(elementMesh.userData.glowMeshes, () => {
      elementMesh.userData.glowMeshes.forEach(glowMesh => {
        elementMesh.remove(glowMesh)
        glowMesh.geometry.dispose()
        glowMesh.material.dispose()
      })
      elementMesh.userData.glowMeshes = []
    })
  } else {
    elementMesh.userData.glowMeshes.forEach(glowMesh => {
      elementMesh.remove(glowMesh)
      glowMesh.geometry.dispose()
      glowMesh.material.dispose()
    })
    elementMesh.userData.glowMeshes = []
  }
}

const getElementBox = (object) => {
  if (object.userData.isElementBox) {
    return object
  }
  if (object.userData.parentElement) {
    return object.userData.parentElement
  }
  let current = object
  while (current.parent && current.parent !== group) {
    current = current.parent
    if (current.userData && current.userData.isElementBox) {
      return current
    }
  }
  return null
}

const onMouseMove = (event) => {
  const container = document.getElementById('container')
  const rect = container.getBoundingClientRect()
  const containerWidth = getContainerWidth()
  
  mouse.x = ((event.clientX - rect.left) / containerWidth) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / window.innerHeight) * 2 + 1

  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x
    const deltaY = event.clientY - previousMousePosition.y
    group.rotation.y += deltaX * 0.01
    group.rotation.x += deltaY * 0.01
  }

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  }

  if (!isDragging) {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(group.children, true)

    let currentHovered = null
    if (intersects.length > 0) {
      const elementBox = getElementBox(intersects[0].object)
      if (elementBox) {
        currentHovered = elementBox
      }
    }

    if (hoveredObject && hoveredObject !== currentHovered) {
      hoveredObject.scale.set(
        hoveredObject.userData.originalScale,
        hoveredObject.userData.originalScale,
        hoveredObject.userData.originalScale
      )
    }

    if (currentHovered && currentHovered !== hoveredObject) {
      hoveredObject = currentHovered
      hoveredObject.scale.set(1.15, 1.15, 1.15)
      document.body.style.cursor = 'pointer'
    } else if (!currentHovered) {
      hoveredObject = null
      document.body.style.cursor = 'default'
    }
  }
}

const onMouseDown = (event) => {
  if (event.button === 0) {
    isDragging = true
    document.body.style.cursor = 'grabbing'
  }
}

const onMouseUp = () => {
  isDragging = false
  document.body.style.cursor = 'default'
}

const onClick = (event) => {
  if (!isDragging) {
    const container = document.getElementById('container')
    const rect = container.getBoundingClientRect()
    const containerWidth = getContainerWidth()
    
    const clickMouse = new THREE.Vector2()
    clickMouse.x = ((event.clientX - rect.left) / containerWidth) * 2 - 1
    clickMouse.y = -((event.clientY - rect.top) / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(clickMouse, camera)
    const intersects = raycaster.intersectObjects(group.children, true)

    if (intersects.length > 0) {
      const elementBox = getElementBox(intersects[0].object)
      if (elementBox && elementBox.userData.element) {
        if (activeElement && activeElement !== elementBox) {
          removeGlowFromElement(activeElement)
        }
        activeElement = elementBox
        addGlowToElement(elementBox)
        showElementInfo(elementBox.userData.element)
      }
    }
  }
}

const resetRotation = () => {
  group.rotation.x = 0
  group.rotation.y = 0
  group.rotation.z = 0
}

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('mousedown', onMouseDown)
window.addEventListener('mouseup', onMouseUp)
window.addEventListener('click', onClick)

document.getElementById('reset-rotation').addEventListener('click', resetRotation)

const showElementInfo = (element) => {
  const infoDiv = document.getElementById('element-info')
  infoDiv.innerHTML = `
    <h2>${element.name}</h2>
    <p><strong>Symbol:</strong> ${element.symbol}</p>
    <p><strong>Atomic Number:</strong> ${element.number}</p>
    <p><strong>Category:</strong> ${element.category}</p>
    ${element.atomic_mass ? `<p><strong>Atomic Mass:</strong> ${element.atomic_mass}</p>` : ''}
  `
}

const createLegend = () => {
  const legendDiv = document.getElementById('legend')
  const categoryMap = {
    'Nonmetal': 'nonmetal',
    'Noble Gas': 'noble gas',
    'Alkali Metal': 'alkali metal',
    'Alkaline Earth Metal': 'alkaline earth metal',
    'Transition Metal': 'transition metal',
    'Metalloid': 'metalloid',
    'Post-Transition Metal': 'post-transition metal',
    'Lanthanide': 'lanthanide',
    'Actinide': 'actinide'
  }
  
  const categories = [
    { name: 'Nonmetal', color: '#4a90e2', category: 'nonmetal' },
    { name: 'Noble Gas', color: '#9b59b6', category: 'noble gas' },
    { name: 'Alkali Metal', color: '#f39c12', category: 'alkali metal' },
    { name: 'Alkaline Earth Metal', color: '#e67e22', category: 'alkaline earth metal' },
    { name: 'Transition Metal', color: '#e74c3c', category: 'transition metal' },
    { name: 'Metalloid', color: '#3498db', category: 'metalloid' },
    { name: 'Post-Transition Metal', color: '#1abc9c', category: 'post-transition metal' },
    { name: 'Lanthanide', color: '#f1c40f', category: 'lanthanide' },
    { name: 'Actinide', color: '#e91e63', category: 'actinide' }
  ]

  let legendHTML = '<h3>Legend</h3><div class="legend-items">'
  categories.forEach(category => {
    legendHTML += `
      <div class="legend-item" data-category="${category.category}">
        <span class="legend-color" style="background-color: ${category.color}"></span>
        <span class="legend-label">${category.name}</span>
      </div>
    `
  })
  legendHTML += '</div>'
  legendDiv.innerHTML = legendHTML
  
  const legendItems = legendDiv.querySelectorAll('.legend-item')
  legendItems.forEach(item => {
    const category = item.getAttribute('data-category')
    
    item.addEventListener('mouseenter', () => {
      if (legendHoveredCategory && legendHoveredCategory !== category) {
        const prevElements = elementsByCategory[legendHoveredCategory] || []
        prevElements.forEach(elementMesh => {
          if (elementMesh !== activeElement) {
            removeGlowFromElement(elementMesh, true)
          }
        })
      }
      
      legendHoveredCategory = category
      const categoryElements = elementsByCategory[category] || []
      categoryElements.forEach(elementMesh => {
        if (elementMesh !== activeElement) {
          addGlowToElement(elementMesh, true)
        }
      })
    })
    
    item.addEventListener('mouseleave', () => {
      const categoryElements = elementsByCategory[category] || []
      categoryElements.forEach(elementMesh => {
        if (elementMesh !== activeElement) {
          removeGlowFromElement(elementMesh, true)
        }
      })
      legendHoveredCategory = null
    })
  })
}

createLegend()

const handleResize = () => {
  const infoPanelWidth = 310
  const containerWidth = window.innerWidth - infoPanelWidth
  camera.aspect = containerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerWidth, window.innerHeight)
  
  const boundingBox = new THREE.Box3().setFromObject(group)
  const size = boundingBox.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y)
  const margin = 40
  const availableWidth = containerWidth - (margin * 2)
  const availableHeight = window.innerHeight - (margin * 2)
  const fov = camera.fov * (Math.PI / 180)
  
  const widthFit = (maxDim / 2) / Math.tan(fov / 2) * (containerWidth / availableWidth) * 0.75
  const heightFit = (maxDim / 2) / Math.tan(fov / 2) * (window.innerHeight / availableHeight) * 0.75
  const distance = Math.min(widthFit, heightFit)
  camera.position.z = distance
  camera.lookAt(0, 0, 0)
}

window.addEventListener('resize', handleResize)

const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

animate()
