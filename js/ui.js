import { addGlowToElement, removeGlowFromElement } from './glow.js'

export const showElementInfo = (element) => {
  const infoDiv = document.getElementById('element-info')
  const formattedMass = element.atomic_mass 
    ? parseFloat(element.atomic_mass).toFixed(7).replace(/\.?0+$/, '')
    : null
  infoDiv.innerHTML = `
    <h2>${element.name}</h2>
    <p><strong>Symbol:</strong> ${element.symbol}</p>
    <p><strong>Atomic Number:</strong> ${element.number}</p>
    <p><strong>Category:</strong> ${element.category}</p>
    ${formattedMass ? `<p><strong>Atomic Mass:</strong> ${formattedMass}</p>` : ''}
  `
}

export const createLegend = (elementsByCategory, getActiveElement) => {
  const legendDiv = document.getElementById('legend')
  
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
  
  let legendHoveredCategory = null
  
  const legendItems = legendDiv.querySelectorAll('.legend-item')
  legendItems.forEach(item => {
    const category = item.getAttribute('data-category')
    
    item.addEventListener('mouseenter', () => {
      const activeElement = getActiveElement()
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
      const activeElement = getActiveElement()
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
