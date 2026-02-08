import * as THREE from 'three'
import { addGlowToElement, removeGlowFromElement } from './glow.js'

export const setupInteractions = (scene, camera, group, getContainerWidth, showElementInfo) => {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  let hoveredObject = null
  let isDragging = false
  let previousMousePosition = { x: 0, y: 0 }
  let activeElement = null

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

  const getActiveElement = () => activeElement

  return { getActiveElement }
}
