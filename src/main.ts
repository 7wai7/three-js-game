import "./style.css";
import * as THREE from "three";
import Engine from "./engine/engine.js";
import { createFloor, createPlayer } from "./engine/game/player-factory.js";
import EngineContext from "./engine/contexts/engine.context.js";

// Initialize Three.js renderer, scene, and camera
let screenResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight,
);
let renderResolution = screenResolution.clone().divideScalar(1);
renderResolution.x |= 0;
renderResolution.y |= 0;
let aspectRatio = screenResolution.x / screenResolution.y;

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.shadowMap.enabled = true;
renderer.setSize(screenResolution.x, screenResolution.y);
document.body.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1);
camera.position.x = -5;
camera.position.y = 5;
camera.zoom = 0.4;
camera.updateProjectionMatrix()
camera.lookAt(new THREE.Vector3(0, 1, 0));

const scene = new THREE.Scene();

// Handle window resize
window.addEventListener("resize", () => {
    screenResolution.set(window.innerWidth, window.innerHeight);
    renderResolution.copy(screenResolution).divideScalar(1);
    renderResolution.x |= 0;
    renderResolution.y |= 0;
    aspectRatio = screenResolution.x / screenResolution.y;

    renderer.setSize(screenResolution.x, screenResolution.y);

    camera.left = -aspectRatio;
    camera.right = aspectRatio;
    camera.updateProjectionMatrix();
});

// Initialize the game engine
const engine = new Engine(renderer, scene, camera);
EngineContext.setEngine(engine);

engine.start();



const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

createFloor(engine.world, engine.physicsWorld, scene);
createPlayer(engine.world, engine.physicsWorld, scene);
