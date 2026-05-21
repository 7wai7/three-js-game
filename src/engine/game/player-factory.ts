import * as THREE from "three";
import MeshComponent from "../components/mesh";
import TransformComponent from "../components/transform";
import type World from "../ecs/world";

export function createPlayer(world: World, scene: THREE.Scene) {
    const entity = world.createEntity();

    world.addComponent(entity, new TransformComponent());

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x66cc00 }),
    );
    mesh.castShadow = true;
    scene.add(mesh);

    world.addComponent(entity, new MeshComponent(mesh));

    return entity;
}