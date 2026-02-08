import { elements } from './elements.js'

// Electron configuration for each element (simplified - shows main shells)
const electronConfigurations = {
  1: { shells: [{ n: 1, l: 0, electrons: 1 }] }, // H: 1s¹
  2: { shells: [{ n: 1, l: 0, electrons: 2 }] }, // He: 1s²
  3: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 1 }] }, // Li: 1s² 2s¹
  4: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }] }, // Be: 1s² 2s²
  5: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 1 }] }, // B: 1s² 2s² 2p¹
  6: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 2 }] }, // C: 1s² 2s² 2p²
  7: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 3 }] }, // N: 1s² 2s² 2p³
  8: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 4 }] }, // O: 1s² 2s² 2p⁴
  9: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 5 }] }, // F: 1s² 2s² 2p⁵
  10: { shells: [{ n: 1, l: 0, electrons: 2 }, { n: 2, l: 0, electrons: 2 }, { n: 2, l: 1, electrons: 6 }] }, // Ne: 1s² 2s² 2p⁶
  // Add more as needed - for now, we'll calculate dynamically
}

// Aufbau principle filling order: (n+l) rule, then by n
const fillingOrder = [
  { n: 1, l: 0 }, // 1s
  { n: 2, l: 0 }, // 2s
  { n: 2, l: 1 }, // 2p
  { n: 3, l: 0 }, // 3s
  { n: 3, l: 1 }, // 3p
  { n: 4, l: 0 }, // 4s
  { n: 3, l: 2 }, // 3d
  { n: 4, l: 1 }, // 4p
  { n: 5, l: 0 }, // 5s
  { n: 4, l: 2 }, // 4d
  { n: 5, l: 1 }, // 5p
  { n: 6, l: 0 }, // 6s
  { n: 4, l: 3 }, // 4f
  { n: 5, l: 2 }, // 5d
  { n: 6, l: 1 }, // 6p
  { n: 7, l: 0 }, // 7s
  { n: 5, l: 3 }, // 5f
  { n: 6, l: 2 }, // 6d
  { n: 7, l: 1 }  // 7p
]

// Get electron configuration for an element by atomic number
export const getElectronConfiguration = (atomicNumber) => {
  if (electronConfigurations[atomicNumber]) {
    return electronConfigurations[atomicNumber]
  }
  
  // Calculate electron configuration using Aufbau principle
  const shells = []
  let remainingElectrons = atomicNumber
  
  for (const orbital of fillingOrder) {
    if (remainingElectrons <= 0) break
    
    const maxElectrons = getMaxElectronsInSubshell(orbital.l)
    const electrons = Math.min(remainingElectrons, maxElectrons)
    
    if (electrons > 0) {
      shells.push({
        n: orbital.n,
        l: orbital.l,
        electrons: electrons
      })
      remainingElectrons -= electrons
    }
  }
  
  return { shells }
}

// Get orbital configuration with individual orbitals and spins
// Follows Hund's rule: fill orbitals singly first, then pair up
export const getOrbitalConfiguration = (atomicNumber) => {
  const config = getElectronConfiguration(atomicNumber)
  const orbitals = []
  
  if (!config || !config.shells || !Array.isArray(config.shells)) {
    return orbitals
  }
  
  config.shells.forEach(shell => {
    if (!shell || typeof shell.n === 'undefined' || typeof shell.l === 'undefined') {
      return
    }
    const maxOrbitals = 2 * shell.l + 1 // s=1, p=3, d=5, f=7 orbitals
    const totalElectrons = shell.electrons
    
    // Initialize orbitals
    const orbitalArray = []
    for (let i = 0; i < maxOrbitals; i++) {
      orbitalArray.push({
        n: shell.n,
        l: shell.l,
        orbitalIndex: i,
        electrons: 0,
        spins: []
      })
    }
    
    // Distribute electrons following Hund's rule
    // First pass: fill each orbital with one electron (spin up)
    let remaining = totalElectrons
    for (let i = 0; i < maxOrbitals && remaining > 0; i++) {
      orbitalArray[i].electrons = 1
      orbitalArray[i].spins.push('up')
      remaining--
    }
    
    // Second pass: pair up electrons (spin down)
    for (let i = 0; i < maxOrbitals && remaining > 0; i++) {
      orbitalArray[i].electrons = 2
      orbitalArray[i].spins.push('down')
      remaining--
    }
    
    orbitals.push(...orbitalArray)
  })
  
  return orbitals
}

// Get element by electron count (ion)
export const getElementByElectronCount = (electronCount) => {
  // For ions, we need to find the element that would have this electron count
  // This is simplified - in reality, ions have different properties
  const baseElement = elements.find(e => e.number === electronCount)
  if (baseElement) return baseElement
  
  // If electron count doesn't match atomic number, it's an ion
  // Find the closest element
  const closest = elements.reduce((closest, elem) => {
    const diff = Math.abs(elem.number - electronCount)
    const closestDiff = Math.abs(closest.number - electronCount)
    return diff < closestDiff ? elem : closest
  })
  
  return closest
}

// Calculate shell radius based on principal quantum number
export const getShellRadius = (n) => {
  // Bohr model approximation: r = n² * a₀
  // Using a scale factor for visualization
  return n * 1.5 + 0.5
}

// Get subshell name
export const getSubshellName = (n, l) => {
  const lNames = ['s', 'p', 'd', 'f']
  return `${n}${lNames[l] || ''}`
}

// Get maximum electrons in subshell
export const getMaxElectronsInSubshell = (l) => {
  return 2 * (2 * l + 1)
}
