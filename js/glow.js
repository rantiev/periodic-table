import * as THREE from 'three'
import { getCategoryColor } from './colors.js'

export const addGlowToElement = (elementMesh, animated = false) => {
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

export const removeGlowFromElement = (elementMesh, animated = false) => {
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
