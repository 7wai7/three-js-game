import * as THREE from "three";
import EngineContext from "../contexts/engine.context";
import Object3DComponent from "../components/object";
import CameraComponent from "../components/camera";
import type World from "../ecs/world";

export function createMainCamera(scene: THREE.Scene) {
    const aspect = window.innerWidth / window.innerHeight;

    const camera = new THREE.PerspectiveCamera(70, aspect);
    camera.position.x = -3;
    camera.position.z = 1;
    camera.position.y = 5;
    camera.zoom = 0.4;
    camera.updateProjectionMatrix()
    camera.lookAt(new THREE.Vector3(0, 1, 0));

    scene.add(camera);

    return camera;
}

export function createEcsCamera(world: World, camera: THREE.Camera) {
    const entity = world.createEntity();

    world.addComponent(
        entity,
        new CameraComponent(camera),
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

    const entity = world.createEntity();

    const object = new THREE.Object3D();
    const helper = new THREE.AxesHelper(0.5);
    object.add(helper);

    if (position) object.position.copy(position);
    if (rotation) object.rotation.copy(rotation);
    if (scale) object.scale.copy(scale);

    scene.add(object);

    world.addComponent(
        entity,
        new Object3DComponent(object),
    );

    return entity;
}