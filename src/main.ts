import './style.css';
import * as THREE from 'three';
import Engine from './engine/engine.js';
import EngineContext from './engine/contexts/engine.context.js';
import { createEcsCamera, createMainCamera } from './engine/game/global-factory.js';
import setupResizeHandler from './listeners/setup-resize-listener.js';
import { createFloor, createLight } from './engine/game/terrain-factory.js';
import { instanceModelByConfig } from './engine/model-instancing/instancing.js';
import { autocannonConfig } from './engine/model-instancing/configs/autocannon.js';

// Initialize Three.js renderer, scene, and camera
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = createMainCamera(scene);

// Initialize the game engine
const engine = new Engine(renderer, scene, camera);
EngineContext.setEngine(engine);

// Handle window resize
setupResizeHandler(renderer, camera);

createEcsCamera(engine.world, camera);
createFloor(engine, {
  position: new THREE.Vector3(0, -2, 0),
});

createLight(scene);

instanceModelByConfig(engine, autocannonConfig, new Map()).then(({ model }) => {
  model.position.set(0, -1.7, 0);
});

engine.start();
