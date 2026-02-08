import * as THREE from 'three'

export const colors = {
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

export const getCategoryColor = (category) => {
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

export const getContrastColor = (color) => {
  const r = Math.min(255, color.r * 255 + 100)
  const g = Math.min(255, color.g * 255 + 100)
  const b = Math.min(255, color.b * 255 + 100)
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`
}
