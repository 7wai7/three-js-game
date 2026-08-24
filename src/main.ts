import './style.css';
import * as THREE from 'three';
import Engine from './engine/engine.js';
import EngineContext from './engine/contexts/engine.context.js';
import { createEcsCamera, createMainCamera } from './engine/game/global-factory.js';
import setupResizeHandler from './listeners/setup-resize-listener.js';
import { createTestTerrain } from './engine/game/terrain-factory.js';
import PlayerControlled from './engine/components/player-controlled.js';
import { renderGameUi } from './ui/render-game-ui.js';
import { playerConfig } from './engine/model-instancing/configs/player.js';

// Initialize Three.js renderer, scene, and camera
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className =
  'block [image-rendering:crisp-edges] [image-rendering:pixelated] opacity-[30%]';
document.body.appendChild(renderer.domElement);

const uiRoot = document.getElementById('ui-root');

if (!uiRoot) {
  throw new Error('UI root element not found');
}

renderGameUi(uiRoot);

const scene = new THREE.Scene();
const camera = createMainCamera(scene);

// Initialize the game engine
const engine = new Engine(renderer, scene, camera);
EngineContext.setEngine(engine);

// Handle window resize
setupResizeHandler(renderer, camera);

createEcsCamera(engine.world, camera);
createTestTerrain(engine);

engine.modelInstancer.instance(playerConfig).then(({ entities }) => {
  engine.world.addComponent(entities.next().value, new PlayerControlled());
});

// createPlayer(engine).then((entity) => {
//   engine.world.addComponent(entity, new PlayerControlled());

//   const cameraControllerSystem = engine.world.getSystem(CameraControllerSystem);
//   cameraControllerSystem.followEntity = entity;
// })

engine.start();
