import "./style.css"
import * as THREE from "three"
import { stopGoEased } from "./math.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import initScene, { scene, composer, crystalMesh } from "./initScene.js"

let
  mixer: THREE.AnimationMixer,
  gltfLoader = new GLTFLoader(),
  clock = new THREE.Clock();

const actions: Record<string, THREE.AnimationAction> = {};
let currentAction: THREE.AnimationAction | null = null;

(async function () {
  initScene()
  animate()
  await addPlayer()
})()

function animate() {
  requestAnimationFrame(animate)
  let t = performance.now() / 1000

  let mat = (crystalMesh.material as THREE.MeshPhongMaterial)
  mat.emissiveIntensity = Math.sin(t * 3) * .5 + .5
  crystalMesh.position.y = .7 + Math.sin(t * 2) * .05
  crystalMesh.rotation.y = stopGoEased(t, 2, 4) * 2 * Math.PI

  mixer?.update(clock.getDelta());

  composer.render()
}

async function addPlayer() {
  gltfLoader = new GLTFLoader();
  const base = await gltfLoader.loadAsync('src/assets/Player/Mesh.glb');
  const model = base.scene;
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);
  await loadAnimation('Walk', 'src/assets/Player/Animations/Walk.glb');
  await loadAnimation('FastRun', 'src/assets/Player/Animations/Fast-Run.glb');

  play('Walk');

  setTimeout(() => {
    play('FastRun');
  }, 5000)
}

async function loadAnimation(name: string, url: string) {
  const gltf = await gltfLoader.loadAsync(url);

  if (gltf.animations.length === 0) {
    console.error(`❌ No animations in ${url}`);
    return;
  }

  const clip = gltf.animations[0];
  actions[name] = mixer.clipAction(clip);
}

function play(name: string) {
  const next = actions[name];
  if (!next || next === currentAction) return;

  next.reset().fadeIn(0.2).play();
  currentAction?.fadeOut(0.2);

  currentAction = next;
}
