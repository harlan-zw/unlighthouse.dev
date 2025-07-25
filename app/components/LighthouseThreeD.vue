<script setup lang="ts">
import type { Group } from 'three'
import { useElementHover } from '@vueuse/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
const lighthouseRef = ref<HTMLDivElement>()
const lighthouse = shallowRef<Group>()
const isHovered = useElementHover(lighthouseRef)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number

const z = ref(20)
const rotation = ref(0.01)

onMounted(() => {
  if (!canvasRef.value)
    return

  // Scene setup
  scene = new THREE.Scene()

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.set(0, 0, 15)

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(600, 600)
  renderer.setPixelRatio(window.devicePixelRatio)

  // Controls setup
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // Lighting setup - very bright for FBX materials
  const pointLight = new THREE.PointLight(0xFFFFFF, 7, 0)
  pointLight.position.set(160, -71, 100)
  scene.add(pointLight)

  const ambientLight = new THREE.AmbientLight(0x808080, 3.5)
  scene.add(ambientLight)

  // Add directional light for better visibility
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4)
  directionalLight.position.set(100, 100, 50)
  scene.add(directionalLight)

  // Load FBX model
  const loader = new FBXLoader()
  loader.load(
    `/lighthouse.fbx`,
    (object: Group) => {
      // Keep original model scale
      // object.scale.setScalar(5)

      // Fix materials for unknown types
      object.traverse((child) => {
        if ('isMesh' in child && child.isMesh) {
          const mesh = child as THREE.Mesh
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              if (mat.type === 'MeshPhongMaterial') {
                (mat as THREE.MeshPhongMaterial).shininess = 30
                mat.transparent = true
              }
            })
          }
          else if (mesh.material && mesh.material.type === 'MeshPhongMaterial') {
            const mat = mesh.material as THREE.MeshPhongMaterial
            mat.shininess = 30
            mat.transparent = true
          }
        }
      })

      lighthouse.value = object
      scene.add(object)
    },
  )

  // Animation loop
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)

  // Update animation values
  if (isHovered.value) {
    if (z.value < 30)
      z.value += 0.3 // Zoom in (move closer to camera)
    if (rotation.value > 0.002)
      rotation.value -= 0.0002 // Slow down rotation
  }
  else {
    if (z.value > 20)
      z.value -= 0.3 // Zoom out (move back to original position)
    if (rotation.value < 0.01)
      rotation.value += 0.0002 // Speed up rotation back to normal
  }

  // Update lighthouse model
  if (lighthouse.value) {
    // set initial position
    lighthouse.value.position.set(184, -71, z.value)
    // lighthouse
    if (lighthouse.value.children[0]) {
      lighthouse.value.children[0].rotation.z += rotation.value
      const material = (lighthouse.value.children[0] as any).material
      if (Array.isArray(material) && material[2]) {
        material[2].opacity = 0.2
      }
    }
    // ground
    if (lighthouse.value.children[1])
      lighthouse.value.children[1].rotation.z += rotation.value
    if (lighthouse.value.children[2])
      lighthouse.value.children[2].rotation.z += rotation.value
    if (lighthouse.value.children[3])
      lighthouse.value.children[3].rotation.z += rotation.value

    // ladder
    if (lighthouse.value.children[4])
      lighthouse.value.children[4].visible = false
    if (lighthouse.value.children[5])
      lighthouse.value.children[5].visible = false
    // rocks
    if (lighthouse.value.children[6])
      lighthouse.value.children[6].visible = false
    if (lighthouse.value.children[7])
      lighthouse.value.children[7].visible = false
    if (lighthouse.value.children[8])
      lighthouse.value.children[8].visible = false
  }

  controls.update()
  renderer.render(scene, camera)
}

const showLighthouse = computed(() => {
  return true
})
</script>

<template>
  <div ref="lighthouseRef" :class="showLighthouse ? ['translate-y-3'] : ['opacity-0']" class="hover:scale-105 bg-linear-to-b from-violet-50/5 to-sky-300/3 dark:bg-none rounded-full duration-2000 ease-in-out transform transition w-[600px] h-[600px]">
    <canvas ref="canvasRef" width="600" height="600" />
  </div>
</template>
