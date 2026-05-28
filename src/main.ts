import "./style.css";
import * as THREE from "three";
import Engine from "./engine/engine.js";
import EngineContext from "./engine/contexts/engine.context.js";
import { createEcsCamera, createMainCamera } from "./engine/game/global-factory.js";
import setupResizeHandler from "./listeners/setup-resize-listener.js";
import { createFloor } from "./engine/game/terrain-factory.js";
import { createPlayer } from "./engine/game/player-factory.js";
import { createCar } from "./engine/game/car-factory.js";
import CameraControllerSystem from "./engine/systems/camera-controller.system.js";

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
setupResizeHandler(
    renderer,
    camera,
);

engine.start();


const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


createEcsCamera(engine.world, camera);
createFloor(engine.world, engine.physicsWorld, scene, engine.assets.textures);
createPlayer(engine.world, engine.physicsWorld, scene, engine.assets.gltf);

(async () => {
    const cameraControllerSystem = engine.world.getSystem(CameraControllerSystem);
    const carData = await createCar(engine.world, engine.physicsWorld, scene);
    cameraControllerSystem.followEntity = carData.car;
})()

// createPlayer(engine.world, engine.physicsWorld, scene);

// createEmpty({
//     position: new THREE.Vector3(0, 0.5, 0),
// });
