import "./style.css"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import initScene, { scene, composer, animateScene } from "./scene/initScene.js"

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

  animateScene();
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

  playAnimation('Walk');

  setTimeout(() => {
    playAnimation('FastRun');
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

function playAnimation(name: string) {
  const next = actions[name];
  if (!next || next === currentAction) return;

  next.reset().fadeIn(0.2).play();
  currentAction?.fadeOut(0.2);

  currentAction = next;
}
