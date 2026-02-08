import * as THREE from 'three'
import { elements } from './elements.js'
import { getCategoryColor } from './colors.js'
import { createScene, createCamera, createRenderer, setupLights } from './scene.js'
import { getElectronConfiguration, getOrbitalConfiguration, getElementByElectronCount, getShellRadius, getSubshellName, getMaxElectronsInSubshell } from './electronConfig.js'

let currentElectronCount = 1
let currentElement = elements[0]
let atomGroup = null

const infoPanelWidth = 310
const getContainerWidth = () => window.innerWidth - infoPanelWidth

// Atom visualization scene
const atomScene = createScene()
const getAtomContainerWidth = () => {
  const infoPanelWidth = 310
  const schemeWidth = 550 // Increased from 400
  const margins = 40 // 20px margin on each side
  return window.innerWidth - infoPanelWidth - schemeWidth - margins
}
const atomCamera = new THREE.PerspectiveCamera(75, getAtomContainerWidth() / (window.innerHeight / 2), 0.1, 1000)
atomCamera.position.set(0, 0, 15)
const atomRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
atomRenderer.setSize(getAtomContainerWidth(), window.innerHeight / 2)
atomRenderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('atom-container').appendChild(atomRenderer.domElement)
setupLights(atomScene)

atomGroup = new THREE.Group()
atomScene.add(atomGroup)

// Rotation controls
let isRotating = false
let previousMousePosition = { x: 0, y: 0 }
let rotationSpeed = { x: 0, y: 0 }

const handleMouseDown = (event) => {
  isRotating = true
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  }
}

const handleMouseMove = (event) => {
  if (!isRotating) return
  
  const deltaX = event.clientX - previousMousePosition.x
  const deltaY = event.clientY - previousMousePosition.y
  
  rotationSpeed.y += deltaX * 0.01
  rotationSpeed.x += deltaY * 0.01
  
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  }
}

const handleMouseUp = () => {
  isRotating = false
}

const atomContainer = document.getElementById('atom-container')
atomContainer.addEventListener('mousedown', handleMouseDown)
atomContainer.addEventListener('mousemove', handleMouseMove)
atomContainer.addEventListener('mouseup', handleMouseUp)
atomContainer.addEventListener('mouseleave', handleMouseUp)

const createNucleus = (atomicNumber) => {
  const nucleusGroup = new THREE.Group()
  const radius = 0.5 + (atomicNumber / 118) * 0.3
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  const color = getCategoryColor(currentElement.category)
  const material = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9
  })
  const nucleus = new THREE.Mesh(geometry, material)
  nucleusGroup.add(nucleus)
  
  // Add glow effect
  const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  nucleusGroup.add(glow)
  
  return nucleusGroup
}

// Electron rendering removed - showing only probability density heatmaps

// Create probability density heatmap texture
const createProbabilityTexture = (width = 256, height = 256) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  // Create gradient from dark blue (0) to bright yellow (1)
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#000080') // Dark blue
  gradient.addColorStop(0.3, '#0000FF') // Blue
  gradient.addColorStop(0.6, '#00FFFF') // Cyan
  gradient.addColorStop(0.8, '#FFFF00') // Yellow
  gradient.addColorStop(1, '#FFFF80') // Bright yellow
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const probabilityTexture = createProbabilityTexture()

// Calculate probability density for s orbital
const getSProbability = (r, n) => {
  const normalizedR = r / (n * 2)
  return Math.exp(-normalizedR * normalizedR) * (1 - normalizedR)
}

// Create animated fog cloud for s orbital
const createSOrbital = (radius, color, n) => {
  const group = new THREE.Group()
  const layers = 8
  
  for (let layer = 0; layer < layers; layer++) {
    const layerRadius = radius * (0.3 + (layer / layers) * 0.7)
    const geometry = new THREE.SphereGeometry(layerRadius, 32, 32)
    
    // Create vertex colors based on probability density
    const positions = geometry.attributes.position
    const colors = []
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const r = Math.sqrt(x * x + y * y + z * z)
      
      const probability = getSProbability(r, n)
      const normalizedProb = Math.max(0, Math.min(1, probability * 2))
      
      // Map probability to color with high transparency
      if (normalizedProb < 0.3) {
        colors.push(0, 0, 0.5) // Dark blue
      } else if (normalizedProb < 0.6) {
        const t = (normalizedProb - 0.3) / 0.3
        colors.push(0, t, 1) // Blue to cyan
      } else {
        const t = (normalizedProb - 0.6) / 0.4
        colors.push(t, 1, 0) // Cyan to yellow
      }
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.06 + (layer / layers) * 0.04,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { 
      baseRadius: layerRadius,
      layer: layer,
      time: Math.random() * Math.PI * 2
    }
    group.add(mesh)
  }
  
  return group
}

// Calculate probability density for p orbital
const getPProbability = (x, y, z, axis, n) => {
  let coord = 0
  if (axis === 'x') coord = x
  else if (axis === 'y') coord = y
  else if (axis === 'z') coord = z
  
  const r = Math.sqrt(x * x + y * y + z * z)
  const normalizedR = r / (n * 2)
  const radial = Math.exp(-normalizedR * normalizedR)
  const angular = coord * coord / (r * r + 0.01) // cos²(θ) approximation
  
  return radial * angular
}

// Create animated fog cloud for p orbital lobe
const createPLobe = (radius, color, direction, side, n) => {
  const group = new THREE.Group()
  const layers = 6
  const offset = radius * 0.7 * (side === 'positive' ? 1 : -1)
  
  for (let layer = 0; layer < layers; layer++) {
    const layerRadius = radius * (0.4 + (layer / layers) * 0.6)
    const segments = 24
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    const indices = []
    const colors = []
    
    for (let i = 0; i <= segments; i++) {
      const u = i / segments
      const theta = u * Math.PI
      for (let j = 0; j <= segments; j++) {
        const v = j / segments
        const phi = v * Math.PI * 2
        
        const angularFactor = Math.sin(theta)
        const radialFactor = Math.sin(theta) * (0.7 + 0.3 * Math.sin(theta))
        const r = layerRadius * angularFactor * radialFactor
        
        let x = 0, y = 0, z = 0
        if (direction === 'x') {
          x = r * Math.cos(phi) * Math.sin(theta) + offset
          y = r * Math.sin(phi) * Math.sin(theta)
          z = r * Math.cos(theta)
        } else if (direction === 'y') {
          x = r * Math.cos(phi) * Math.sin(theta)
          y = r * Math.sin(phi) * Math.sin(theta) + offset
          z = r * Math.cos(theta)
        } else if (direction === 'z') {
          x = r * Math.cos(phi) * Math.sin(theta)
          y = r * Math.sin(phi) * Math.sin(theta)
          z = r * Math.cos(theta) + offset
        }
        
        vertices.push(x, y, z)
        
        const probability = getPProbability(x, y, z, direction, n)
        const normalizedProb = Math.max(0, Math.min(1, probability * 4))
        
        if (normalizedProb < 0.3) {
          colors.push(0, 0, 0.5)
        } else if (normalizedProb < 0.6) {
          const t = (normalizedProb - 0.3) / 0.3
          colors.push(0, t, 1)
        } else {
          const t = (normalizedProb - 0.6) / 0.4
          colors.push(t, 1, 0)
        }
      }
    }
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = a + segments + 1
        indices.push(a, b, a + 1)
        indices.push(b, b + 1, a + 1)
      }
    }
    
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()
    
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.05 + (layer / layers) * 0.03,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      baseRadius: layerRadius,
      layer: layer,
      time: Math.random() * Math.PI * 2,
      direction: direction,
      offset: offset
    }
    group.add(mesh)
  }
  
  return group
}

const createPOrbital = (radius, color, axis, n) => {
  const group = new THREE.Group()
  const scale = radius * 0.7
  
  const lobe1 = createPLobe(scale, color, axis, 'positive', n)
  const lobe2 = createPLobe(scale, color, axis, 'negative', n)
  
  group.add(lobe1)
  group.add(lobe2)
  
  return group
}

// Old createDLobe removed - using heatmap version below

// Calculate probability density for d orbital
const getDProbability = (x, y, z, type, n) => {
  const r = Math.sqrt(x * x + y * y + z * z)
  const normalizedR = r / (n * 2)
  const radial = Math.exp(-normalizedR * normalizedR)
  
  let angular = 0
  if (type === 'xy') {
    angular = (x * y) * (x * y) / (r * r * r * r + 0.01)
  } else if (type === 'xz') {
    angular = (x * z) * (x * z) / (r * r * r * r + 0.01)
  } else if (type === 'yz') {
    angular = (y * z) * (y * z) / (r * r * r * r + 0.01)
  } else if (type === 'x²-y²' || type === 'dx²-y²') {
    angular = ((x * x - y * y) / (r * r + 0.01)) * ((x * x - y * y) / (r * r + 0.01))
  } else if (type === 'z²' || type === 'dz²') {
    angular = ((3 * z * z - r * r) / (r * r + 0.01)) * ((3 * z * z - r * r) / (r * r + 0.01))
  }
  
  return radial * Math.abs(angular)
}

// Create animated fog cloud for d orbital lobe
const createDLobe = (radius, color, angle, plane, n) => {
  const group = new THREE.Group()
  const layers = 5
  
  for (let layer = 0; layer < layers; layer++) {
    const layerRadius = radius * (0.5 + (layer / layers) * 0.5)
    const segments = 20
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    const indices = []
    const colors = []
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI
      for (let j = 0; j <= segments; j++) {
        const phi = (j / segments) * Math.PI * 2
        
        const angular = Math.sin(theta) * Math.sin(theta) * Math.cos(2 * phi + angle)
        const radial = Math.sin(theta) * (0.5 + 0.5 * Math.sin(theta))
        const r = layerRadius * Math.abs(angular) * radial
        
        let x = 0, y = 0, z = 0
        if (plane === 'xy') {
          x = r * Math.cos(phi + angle) * Math.sin(theta)
          y = r * Math.sin(phi + angle) * Math.sin(theta)
          z = r * Math.cos(theta) * 0.2
        } else if (plane === 'xz') {
          x = r * Math.cos(phi + angle) * Math.sin(theta)
          y = r * Math.cos(theta) * 0.2
          z = r * Math.sin(phi + angle) * Math.sin(theta)
        } else if (plane === 'yz') {
          x = r * Math.cos(theta) * 0.2
          y = r * Math.cos(phi + angle) * Math.sin(theta)
          z = r * Math.sin(phi + angle) * Math.sin(theta)
        }
        
        vertices.push(x, y, z)
        
        const probability = getDProbability(x, y, z, plane, n)
        const normalizedProb = Math.max(0, Math.min(1, probability * 2))
        
        if (normalizedProb < 0.3) {
          colors.push(0, 0, 0.5)
        } else if (normalizedProb < 0.6) {
          const t = (normalizedProb - 0.3) / 0.3
          colors.push(0, t, 1)
        } else {
          const t = (normalizedProb - 0.6) / 0.4
          colors.push(t, 1, 0)
        }
      }
    }
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = a + segments + 1
        indices.push(a, b, a + 1)
        indices.push(b, b + 1, a + 1)
      }
    }
    
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()
    
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.04 + (layer / layers) * 0.03,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      baseRadius: layerRadius,
      layer: layer,
      time: Math.random() * Math.PI * 2,
      plane: plane,
      angle: angle
    }
    group.add(mesh)
  }
  
  return group
}

const createDOrbital = (radius, color, type, n) => {
  const group = new THREE.Group()
  const scale = radius * 0.65
  
  if (type === 'xy' || type === 'xz' || type === 'yz') {
    const plane = type
    for (let i = 0; i < 4; i++) {
      const lobe = createDLobe(scale, color, (i * Math.PI) / 2, plane, n)
      group.add(lobe)
    }
  } else if (type === 'z²' || type === 'dz²') {
    // dz² - fog cloud for torus region with lobes above and below
    const torusLayers = 4
    const torusRadius = scale * 0.6
    const tubeRadius = scale * 0.15
    
    for (let layer = 0; layer < torusLayers; layer++) {
      const layerTubeRadius = tubeRadius * (0.7 + (layer / torusLayers) * 0.3)
      const torusGeometry = new THREE.TorusGeometry(torusRadius, layerTubeRadius, 16, 32)
      const positions = torusGeometry.attributes.position
      const torusColors = []
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        const probability = getDProbability(x, y, z, 'z²', n)
        const normalizedProb = Math.max(0, Math.min(1, probability * 2))
        
        if (normalizedProb < 0.3) {
          torusColors.push(0, 0, 0.5)
        } else if (normalizedProb < 0.6) {
          const t = (normalizedProb - 0.3) / 0.3
          torusColors.push(0, t, 1)
        } else {
          const t = (normalizedProb - 0.6) / 0.4
          torusColors.push(t, 1, 0)
        }
      }
      
      torusGeometry.setAttribute('color', new THREE.Float32BufferAttribute(torusColors, 3))
      const torusMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.04 + (layer / torusLayers) * 0.02,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0
      })
      
      const torus = new THREE.Mesh(torusGeometry, torusMaterial)
      torus.userData = {
        baseRadius: torusRadius,
        baseTubeRadius: layerTubeRadius,
        layer: layer,
        time: Math.random() * Math.PI * 2
      }
      group.add(torus)
    }
    
    const topLobe = createPLobe(scale * 0.5, color, 'z', 'positive', n)
    topLobe.position.z = scale * 0.8
    group.add(topLobe)
    
    const bottomLobe = createPLobe(scale * 0.5, color, 'z', 'negative', n)
    bottomLobe.position.z = -scale * 0.8
    group.add(bottomLobe)
  } else if (type === 'x²-y²' || type === 'dx²-y²') {
    const lobe1 = createPLobe(scale * 0.6, color, 'x', 'positive', n)
    lobe1.position.x = scale * 0.9
    group.add(lobe1)
    
    const lobe2 = createPLobe(scale * 0.6, color, 'x', 'negative', n)
    lobe2.position.x = -scale * 0.9
    group.add(lobe2)
    
    const lobe3 = createPLobe(scale * 0.6, color, 'y', 'positive', n)
    lobe3.position.y = scale * 0.9
    group.add(lobe3)
    
    const lobe4 = createPLobe(scale * 0.6, color, 'y', 'negative', n)
    lobe4.position.y = -scale * 0.9
    group.add(lobe4)
  }
  
  return group
}

const createFOrbital = (radius, color, n) => {
  const group = new THREE.Group()
  const scale = radius * 0.55
  
  // f orbitals have 6-8 lobes in complex 3D arrangements
  const offsets = [
    { x: 1, y: 0, z: 0, dir: 'x', side: 'positive' },
    { x: -1, y: 0, z: 0, dir: 'x', side: 'negative' },
    { x: 0, y: 1, z: 0, dir: 'y', side: 'positive' },
    { x: 0, y: -1, z: 0, dir: 'y', side: 'negative' },
    { x: 0, y: 0, z: 1, dir: 'z', side: 'positive' },
    { x: 0, y: 0, z: -1, dir: 'z', side: 'negative' },
    { x: 0.7, y: 0.7, z: 0, dir: 'x', side: 'positive' },
    { x: -0.7, y: -0.7, z: 0, dir: 'x', side: 'negative' }
  ]
  
  offsets.forEach((offset) => {
    const lobe = createPLobe(scale * 0.45, color, offset.dir, offset.side, n)
    lobe.position.set(
      offset.x * scale * 0.8,
      offset.y * scale * 0.8,
      offset.z * scale * 0.8
    )
    group.add(lobe)
  })
  
  return group
}

// Electron cloud rendering removed - using probability density heatmaps instead

const updateAtomVisualization = () => {
  // Clear previous visualization
  while (atomGroup.children.length > 0) {
    atomGroup.remove(atomGroup.children[0])
  }
  
  // Create nucleus
  const nucleus = createNucleus(currentElement.number)
  atomGroup.add(nucleus)
  
  // Get orbital configuration with individual orbitals
  const orbitals = getOrbitalConfiguration(currentElectronCount)
  
  if (!Array.isArray(orbitals)) {
    return
  }
  
  // Group orbitals by subshell
  const subshells = {}
  orbitals.forEach(orbital => {
    if (!orbital || typeof orbital.n === 'undefined' || typeof orbital.l === 'undefined') {
      return
    }
    const key = `${orbital.n}${['s', 'p', 'd', 'f'][orbital.l]}`
    if (!subshells[key]) {
      subshells[key] = {
        n: orbital.n,
        l: orbital.l,
        orbitals: []
      }
    }
    if (subshells[key].orbitals) {
      subshells[key].orbitals.push(orbital)
    }
  })
  
  // Create orbital visualizations
  Object.keys(subshells).forEach(key => {
    const subshell = subshells[key]
    if (!subshell || !subshell.orbitals) return
    
    const radius = getShellRadius(subshell.n)
    const color = new THREE.Color().setHSL((subshell.n * 0.15) % 1, 0.7, 0.6)
    
    // Create orbital shapes based on type (heatmap visualization)
    if (subshell.l === 0) {
      // s orbital - spherical probability density
      const sOrbital = createSOrbital(radius, color, subshell.n)
      atomGroup.add(sOrbital)
    } else if (subshell.l === 1) {
      // p orbitals - dumbbell shaped along x, y, z axes
      const pAxes = ['x', 'y', 'z']
      subshell.orbitals.forEach((orbital, index) => {
        const axis = pAxes[index] || 'x'
        const pOrbital = createPOrbital(radius, color, axis, subshell.n)
        atomGroup.add(pOrbital)
      })
    } else if (subshell.l === 2) {
      // d orbitals - cloverleaf patterns
      const dTypes = ['xy', 'xz', 'yz', 'x²-y²', 'z²']
      subshell.orbitals.forEach((orbital, index) => {
        const dOrbital = createDOrbital(radius, color, dTypes[index] || 'xy', subshell.n)
        atomGroup.add(dOrbital)
      })
    } else if (subshell.l === 3) {
      // f orbitals - complex shapes
      subshell.orbitals.forEach(orbital => {
        const fOrbital = createFOrbital(radius, color, subshell.n)
        atomGroup.add(fOrbital)
      })
    }
  })
}

const hslToHex = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h * 6) % 2 - 1))
  const m = l - c / 2
  let r, g, b
  
  if (h < 1/6) { r = c; g = x; b = 0 }
  else if (h < 2/6) { r = x; g = c; b = 0 }
  else if (h < 3/6) { r = 0; g = c; b = x }
  else if (h < 4/6) { r = 0; g = x; b = c }
  else if (h < 5/6) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const createLevelScheme = () => {
  try {
    const levelsContainer = document.getElementById('electron-levels')
    if (!levelsContainer) {
      console.error('electron-levels container not found')
      return
    }
    
    levelsContainer.innerHTML = ''
    
    const orbitals = getOrbitalConfiguration(currentElectronCount)
    
    if (!Array.isArray(orbitals)) {
      console.error('getOrbitalConfiguration did not return an array', orbitals)
      return
    }
  
  // Group orbitals by subshell (n, l)
  const subshells = {}
  if (orbitals && Array.isArray(orbitals)) {
    orbitals.forEach(orbital => {
      if (!orbital || typeof orbital.n === 'undefined' || typeof orbital.l === 'undefined') {
        return
      }
      const key = `${orbital.n}${['s', 'p', 'd', 'f'][orbital.l]}`
      if (!subshells[key]) {
        subshells[key] = {
          n: orbital.n,
          l: orbital.l,
          orbitals: []
        }
      }
      if (subshells[key] && subshells[key].orbitals) {
        subshells[key].orbitals.push(orbital)
      }
    })
  }
  
  // Ensure all orbitals are present
  const subshellKeys = Object.keys(subshells)
  if (subshellKeys && Array.isArray(subshellKeys)) {
    subshellKeys.forEach(key => {
      const subshell = subshells[key]
      if (!subshell || typeof subshell.l === 'undefined') return
      
      const maxOrbitals = 2 * subshell.l + 1
      if (!subshell.orbitals) {
        subshell.orbitals = []
      }
      while (subshell.orbitals.length < maxOrbitals) {
        subshell.orbitals.push({
          n: subshell.n,
          l: subshell.l,
          orbitalIndex: subshell.orbitals.length,
          electrons: 0,
          spins: []
        })
      }
      if (Array.isArray(subshell.orbitals)) {
        subshell.orbitals.sort((a, b) => (a.orbitalIndex || 0) - (b.orbitalIndex || 0))
      }
    })
  }
  
  // Calculate positions for each orbital
  const cellSize = 24
  const cellMargin = 1
  const cellSpacing = cellSize + cellMargin * 2
  const baseRowHeight = 28
  
  // Add legend on the right side
  const legendContainer = document.createElement('div')
  legendContainer.style.position = 'absolute'
  legendContainer.style.right = '0px'
  legendContainer.style.top = '0px'
  legendContainer.style.display = 'flex'
  legendContainer.style.flexDirection = 'column'
  legendContainer.style.gap = '5px'
  legendContainer.style.padding = '5px'
  
  const legendItems = [
    { label: 's', color: 'rgba(0, 200, 200, 0.3)' },
    { label: 'p', color: 'rgba(200, 200, 0, 0.3)' },
    { label: 'd', color: 'rgba(150, 0, 150, 0.3)' },
    { label: 'f', color: 'rgba(0, 100, 255, 0.3)' }
  ]
  
  legendItems.forEach(item => {
    const legendItem = document.createElement('div')
    legendItem.style.display = 'flex'
    legendItem.style.alignItems = 'center'
    legendItem.style.gap = '5px'
    legendItem.style.fontSize = '11px'
    legendItem.style.color = '#e0e0e0'
    
    const colorBox = document.createElement('div')
    colorBox.style.width = '16px'
    colorBox.style.height = '16px'
    colorBox.style.backgroundColor = item.color
    colorBox.style.borderRadius = '2px'
    
    const label = document.createElement('span')
    label.textContent = item.label
    
    legendItem.appendChild(colorBox)
    legendItem.appendChild(label)
    legendContainer.appendChild(legendItem)
  })
  
  levelsContainer.appendChild(legendContainer)
  
  // Define base Y positions for each n level (s orbitals) - reversed: 7 at top, 1 at bottom
  const baseYPositions = {}
  const totalRows = 7
  for (let n = 1; n <= 7; n++) {
    baseYPositions[n] = (totalRows - n) * baseRowHeight
  }
  
  // Create cells organized by columns (s, p, d, f) with vertical offsets
  for (let n = 1; n <= 7; n++) {
    // s column - single cell (base position)
    const sKey = `${n}s`
    const sSubshell = subshells[sKey]
    const sCell = document.createElement('div')
    sCell.className = 'orbital-cell s-block'
    sCell.style.position = 'absolute'
    sCell.style.left = '0px'
    sCell.style.top = `${baseYPositions[n]}px`
    
    // Add sublevel number in bottom left corner
    const sNumber = document.createElement('div')
    sNumber.textContent = n
    sNumber.style.position = 'absolute'
    sNumber.style.bottom = '1px'
    sNumber.style.left = '2px'
    sNumber.style.fontSize = '8px'
    sNumber.style.color = '#e0e0e0'
    sNumber.style.lineHeight = '1'
    sCell.appendChild(sNumber)
    
    if (sSubshell && sSubshell.orbitals && sSubshell.orbitals[0]) {
      const orbital = sSubshell.orbitals[0]
      if (orbital.electrons > 0) {
        sCell.classList.add('filled')
        orbital.spins.forEach(spin => {
          const arrow = document.createElement('span')
          arrow.className = `spin-arrow ${spin}`
          arrow.textContent = spin === 'up' ? '↑' : '↓'
          sCell.appendChild(arrow)
        })
      }
    }
    levelsContainer.appendChild(sCell)
    
    // p columns - 3 cells (lower than next s)
    if (n >= 2) {
      const pKey = `${n}p`
      const pSubshell = subshells[pKey]
      // p orbitals positioned lower than next s level
      const pY = baseYPositions[n] + (n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 10 : n === 5 ? 10 : n === 6 ? 10 : 0)
      
      for (let i = 0; i < 3; i++) {
        const pCell = document.createElement('div')
        pCell.className = 'orbital-cell p-block'
        pCell.style.position = 'absolute'
        pCell.style.left = `${cellSpacing + i * cellSpacing}px`
        pCell.style.top = `${pY}px`
        
        // Add sublevel number in bottom left corner
        const pNumber = document.createElement('div')
        pNumber.textContent = n
        pNumber.style.position = 'absolute'
        pNumber.style.bottom = '1px'
        pNumber.style.left = '2px'
        pNumber.style.fontSize = '8px'
        pNumber.style.color = '#e0e0e0'
        pNumber.style.lineHeight = '1'
        pCell.appendChild(pNumber)
        
        if (pSubshell && pSubshell.orbitals && pSubshell.orbitals[i]) {
          const orbital = pSubshell.orbitals[i]
          if (orbital.electrons > 0) {
            pCell.classList.add('filled')
            orbital.spins.forEach(spin => {
              const arrow = document.createElement('span')
              arrow.className = `spin-arrow ${spin}`
              arrow.textContent = spin === 'up' ? '↑' : '↓'
              pCell.appendChild(arrow)
            })
          }
        }
        levelsContainer.appendChild(pCell)
      }
    }
    
    // d columns - 5 cells (between next s and next p)
    if (n >= 3) {
      const dKey = `${n}d`
      const dSubshell = subshells[dKey]
      // d orbitals positioned between next s and next p
      const dY = baseYPositions[n] + (n === 3 ? 5 : n === 4 ? 5 : n === 5 ? 5 : n === 6 ? 5 : 0)
      
      for (let i = 0; i < 5; i++) {
        const dCell = document.createElement('div')
        dCell.className = 'orbital-cell d-block'
        dCell.style.position = 'absolute'
        dCell.style.left = `${cellSpacing * 4 + i * cellSpacing}px`
        dCell.style.top = `${dY}px`
        
        // Add sublevel number in bottom left corner
        const dNumber = document.createElement('div')
        dNumber.textContent = n
        dNumber.style.position = 'absolute'
        dNumber.style.bottom = '1px'
        dNumber.style.left = '2px'
        dNumber.style.fontSize = '8px'
        dNumber.style.color = '#e0e0e0'
        dNumber.style.lineHeight = '1'
        dCell.appendChild(dNumber)
        
        if (dSubshell && dSubshell.orbitals && dSubshell.orbitals[i]) {
          const orbital = dSubshell.orbitals[i]
          if (orbital.electrons > 0) {
            dCell.classList.add('filled')
            orbital.spins.forEach(spin => {
              const arrow = document.createElement('span')
              arrow.className = `spin-arrow ${spin}`
              arrow.textContent = spin === 'up' ? '↑' : '↓'
              dCell.appendChild(arrow)
            })
          }
        }
        levelsContainer.appendChild(dCell)
      }
    }
    
    // f columns - 7 cells (lower than next d)
    if (n >= 4) {
      const fKey = `${n}f`
      const fSubshell = subshells[fKey]
      // f orbitals positioned lower than next d
      const fY = baseYPositions[n] + (n === 4 ? 7 : n === 5 ? 7 : 0)
      
      for (let i = 0; i < 7; i++) {
        const fCell = document.createElement('div')
        fCell.className = 'orbital-cell f-block'
        fCell.style.position = 'absolute'
        fCell.style.left = `${cellSpacing * 9 + i * cellSpacing}px`
        fCell.style.top = `${fY}px`
        
        // Add sublevel number in bottom left corner
        const fNumber = document.createElement('div')
        fNumber.textContent = n
        fNumber.style.position = 'absolute'
        fNumber.style.bottom = '1px'
        fNumber.style.left = '2px'
        fNumber.style.fontSize = '8px'
        fNumber.style.color = '#e0e0e0'
        fNumber.style.lineHeight = '1'
        fCell.appendChild(fNumber)
        
        if (fSubshell && fSubshell.orbitals && fSubshell.orbitals[i]) {
          const orbital = fSubshell.orbitals[i]
          if (orbital.electrons > 0) {
            fCell.classList.add('filled')
            orbital.spins.forEach(spin => {
              const arrow = document.createElement('span')
              arrow.className = `spin-arrow ${spin}`
              arrow.textContent = spin === 'up' ? '↑' : '↓'
              fCell.appendChild(arrow)
            })
          }
        }
        levelsContainer.appendChild(fCell)
      }
    }
  }
  } catch (error) {
    console.error('Error in createLevelScheme:', error)
    console.error('Stack:', error.stack)
  }
}

const updateElementInfo = () => {
  const infoDiv = document.getElementById('element-info')
  const config = getElectronConfiguration(currentElectronCount)
  const configString = config.shells.map(s => `${getSubshellName(s.n, s.l)}${s.electrons > 0 ? '⁽' + s.electrons + '⁾' : ''}`).join(' ')
  
  infoDiv.innerHTML = `
    <h2>${currentElement.name}</h2>
    <p><strong>Symbol:</strong> ${currentElement.symbol}</p>
    <p><strong>Atomic Number:</strong> ${currentElement.number}</p>
    <p><strong>Electrons:</strong> ${currentElectronCount}</p>
    <p><strong>Category:</strong> ${currentElement.category}</p>
    <p><strong>Configuration:</strong> ${configString}</p>
    ${currentElement.atomic_mass ? `<p><strong>Atomic Mass:</strong> ${parseFloat(currentElement.atomic_mass).toFixed(7).replace(/\.?0+$/, '')}</p>` : ''}
  `
}

const addElectron = () => {
  if (currentElectronCount < 118) {
    currentElectronCount++
    currentElement = getElementByElectronCount(currentElectronCount)
    updateAtomVisualization()
    createLevelScheme()
    updateElementInfo()
  }
}

const removeElectron = () => {
  if (currentElectronCount > 1) {
    currentElectronCount--
    currentElement = getElementByElectronCount(currentElectronCount)
    updateAtomVisualization()
    createLevelScheme()
    updateElementInfo()
  }
}

const resetElement = () => {
  currentElectronCount = currentElement.number
  updateAtomVisualization()
  createLevelScheme()
  updateElementInfo()
}

const selectElement = (atomicNumber) => {
  currentElement = elements.find(e => e.number === atomicNumber) || elements[0]
  currentElectronCount = currentElement.number
  updateAtomVisualization()
  createLevelScheme()
  updateElementInfo()
}

// Initialize
const elementSelect = document.getElementById('element-select')
elements.forEach(element => {
  const option = document.createElement('option')
  option.value = element.number
  option.textContent = `${element.number}. ${element.symbol} - ${element.name}`
  elementSelect.appendChild(option)
})

elementSelect.addEventListener('change', (e) => {
  selectElement(parseInt(e.target.value))
})

document.getElementById('add-electron').addEventListener('click', addElectron)
document.getElementById('remove-electron').addEventListener('click', removeElectron)
document.getElementById('reset-element').addEventListener('click', resetElement)

// Initial setup - wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateAtomVisualization()
    createLevelScheme()
    updateElementInfo()
  })
} else {
  updateAtomVisualization()
  createLevelScheme()
  updateElementInfo()
}

// Animation loop with rotation controls and fog animation
let animationTime = 0
const animate = () => {
  requestAnimationFrame(animate)
  
  animationTime += 0.01
  
  // Apply rotation from mouse drag
  atomGroup.rotation.y += rotationSpeed.y
  atomGroup.rotation.x += rotationSpeed.x
  
  // Damping for smooth rotation
  rotationSpeed.y *= 0.95
  rotationSpeed.x *= 0.95
  
  // Animate fog layers with cloud-like motion
  atomGroup.children.forEach(child => {
    if (child.userData && child.userData.baseRadius !== undefined) {
      const time = animationTime + child.userData.time
      const layer = child.userData.layer || 0
      
      // Cloud-like pulsing with multiple frequencies for organic feel
      const pulse1 = Math.sin(time * 0.4 + layer * 0.5) * 0.08
      const pulse2 = Math.sin(time * 0.7 + layer * 0.3) * 0.05
      const pulse3 = Math.cos(time * 0.3 + layer * 0.7) * 0.03
      const pulse = 1 + pulse1 + pulse2 + pulse3
      
      // Wobble effect for cloud-like distortion
      const wobbleX = Math.sin(time * 0.5 + layer * 0.4) * 0.02
      const wobbleY = Math.cos(time * 0.6 + layer * 0.5) * 0.02
      const wobbleZ = Math.sin(time * 0.4 + layer * 0.6) * 0.02
      
      if (child.userData.baseTubeRadius !== undefined) {
        // Torus fog
        const torus = child
        torus.scale.set(
          pulse + wobbleX,
          pulse + wobbleY,
          pulse + wobbleZ
        )
        if (torus.material) {
          const baseOpacity = 0.1 + (layer / 4) * 0.05
          const opacityVariation = Math.sin(time * 0.4) * 0.15 + Math.cos(time * 0.6) * 0.1
          torus.material.opacity = baseOpacity * (0.7 + opacityVariation)
        }
      } else {
        // Spherical/lobe fog
        child.scale.set(
          pulse + wobbleX,
          pulse + wobbleY,
          pulse + wobbleZ
        )
        if (child.material) {
          const baseOpacity = child.userData.layer !== undefined 
            ? (0.06 + (layer / 8) * 0.04)
            : (0.05 + (layer / 6) * 0.03)
          const opacityVariation = Math.sin(time * 0.4 + layer * 0.2) * 0.1 + Math.cos(time * 0.6 + layer * 0.3) * 0.05
          child.material.opacity = baseOpacity * (0.5 + opacityVariation)
        }
        
        // Add subtle rotation for cloud movement
        if (child.userData.direction) {
          const rotSpeed = 0.01 + layer * 0.005
          if (child.userData.direction === 'x') {
            child.rotation.y += rotSpeed * Math.sin(time * 0.3)
            child.rotation.z += rotSpeed * Math.cos(time * 0.4)
          } else if (child.userData.direction === 'y') {
            child.rotation.x += rotSpeed * Math.sin(time * 0.3)
            child.rotation.z += rotSpeed * Math.cos(time * 0.4)
          } else if (child.userData.direction === 'z') {
            child.rotation.x += rotSpeed * Math.sin(time * 0.3)
            child.rotation.y += rotSpeed * Math.cos(time * 0.4)
          }
        } else {
          // Spherical clouds - gentle rotation
          child.rotation.x += 0.002 * Math.sin(time * 0.2 + layer * 0.1)
          child.rotation.y += 0.002 * Math.cos(time * 0.25 + layer * 0.15)
          child.rotation.z += 0.001 * Math.sin(time * 0.3 + layer * 0.2)
        }
      }
    }
  })
  
  atomRenderer.render(atomScene, atomCamera)
}

animate()

// Handle resize
const handleResize = () => {
  const atomWidth = getAtomContainerWidth()
  const atomHeight = window.innerHeight / 2
  
  atomCamera.aspect = atomWidth / atomHeight
  atomCamera.updateProjectionMatrix()
  atomRenderer.setSize(atomWidth, atomHeight)
}

window.addEventListener('resize', handleResize)
