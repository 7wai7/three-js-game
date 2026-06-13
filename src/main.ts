import "./style.css";
import * as THREE from "three";
import Engine from "./engine/engine.js";
import EngineContext from "./engine/contexts/engine.context.js";
import { createEcsCamera, createMainCamera } from "./engine/game/global-factory.js";
import setupResizeHandler from "./listeners/setup-resize-listener.js";
import { createCube, createFloor, createLight } from "./engine/game/terrain-factory.js";
import { createPlayer } from "./engine/game/player-factory.js";
import CameraControllerSystem from "./engine/systems/camera-controller.system.js";
import { createCar } from "./engine/game/car-factory.js";
import { instanceModelByConfig } from "./engine/model-instancing/instancing.js";
import { testCarConfig } from "./engine/model-instancing/configs/test-car.js";
import type { InstanceNodeMap } from "./engine/model-instancing/config-types.js";
import CarComponent from "./engine/components/vehicle/car.js";
import Object3DComponent from "./engine/components/object.js";
import RigidBodyComponent from "./engine/components/rigidbody.js";
import PlayerInputComponent from "./engine/components/player-input.js";

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


const cameraControllerSystem = engine.world.getSystem(CameraControllerSystem);

createEcsCamera(engine.world, camera);
createFloor(engine, {
    position: new THREE.Vector3(0, -2, 0),
});

createLight(scene);

engine.assets.gltf.loadModel("src/assets/car.glb")
    .then(gltf => {
        const root = gltf.scene;

        const objectMap: InstanceNodeMap = new Map();
        const entities = instanceModelByConfig(
            engine.world,
            engine.physicsWorld,
            engine.scene,
            testCarConfig,
            objectMap,
            root
        );

        const car = engine.world.getComponentsFromEntities(entities,  CarComponent)[0];
        console.log(root)
        engine.world.addComponent(car.entity, new PlayerInputComponent());
        cameraControllerSystem.followEntity = car.entity;
    })


// createCar(engine, "src/assets/car.glb", {
//     transform: {
//         position: new THREE.Vector3(0, 17, 0)
//     }
// })
//     .then(({ entity, object3D }) => {
//         cameraControllerSystem.followEntity = entity;
//         object3D.visible = false;
//     })



engine.start();
