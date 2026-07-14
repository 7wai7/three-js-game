import * as THREE from "three";
import EngineContext from "../contexts/engine.context";
import Camera from "../components/camera";
import type GameWorld from "./game-world";

export function createMainCamera(scene: THREE.Scene) {
    const aspect = window.innerWidth / window.innerHeight;

    const camera = new THREE.PerspectiveCamera(70, aspect);
    camera.position.x = -3;
    camera.position.z = 1;
    camera.position.y = 5;
    camera.updateProjectionMatrix()
    camera.lookAt(new THREE.Vector3(0, 1, 0));

    scene.add(camera);

    return camera;
}

export function createEcsCamera(world: GameWorld, camera: THREE.Camera) {
    const entity = world.createGameObject(camera);

    world.addComponent(
        entity,
        new Camera(camera),
    );

    return { entity, camera };
}

export function createEmpty({
    position,
    rotation,
    scale,
}: {
    position?: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3,
} = {}) {
    const world = EngineContext.engine.world;
    const scene = EngineContext.engine.scene;

    const object = new THREE.Object3D();
    const helper = new THREE.AxesHelper(0.5);
    object.add(helper);

    if (position) object.position.copy(position);
    if (rotation) object.rotation.copy(rotation);
    if (scale) object.scale.copy(scale);

    scene.add(object);

    const entity = world.createGameObject(object);

    return entity;
}