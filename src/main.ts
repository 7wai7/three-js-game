import './style.css';
import * as THREE from 'three';
import Engine from './engine/engine.js';
import EngineContext from './engine/contexts/engine.context.js';
import { createEcsCamera, createMainCamera } from './engine/game/global-factory.js';
import setupResizeHandler from './listeners/setup-resize-listener.js';
import { createTestTerrain } from './engine/game/terrain-factory.js';
import { Rx_Vision_GT3_config } from './engine/model-instancing/configs/Rx-Vision-GT3.js';
import Car from './engine/components/vehicle/car.js';
import CameraControllerSystem from './engine/systems/camera-controller.system.js';
import PlayerControlled from './engine/components/player-controlled.js';
import { renderGameUi } from './ui/render-game-ui.js';

// Initialize Three.js renderer, scene, and camera
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className = 'block [image-rendering:crisp-edges] [image-rendering:pixelated]';
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

// engine.modelInstancer.instance(autocannonConfig, new Map()).then(({ entities }) => {
//   const [weapon] = engine.world.getComponentsFromEntities([...entities], Weapon);
//   const aims = engine.world.getChildComponents(weapon.entity, AimAtTarget);

//   const target = new THREE.Vector3(0, 2, 10);

//   aims.forEach((aim) => (aim.targetPosition = target));
// });

engine.modelInstancer.instance(Rx_Vision_GT3_config).then(({ entities }) => {
  const [chassis] = engine.world.getComponentsFromEntities([...entities], Car);

  engine.world.addComponent(chassis.entity, new PlayerControlled());

  const cameraControllerSystem = engine.world.getSystem(CameraControllerSystem);
  cameraControllerSystem.followEntity = chassis.entity;
});

engine.start();
