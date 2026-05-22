import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import MeshComponent from "../components/mesh";
import type World from "../ecs/world";
import CollidersComponent from "../components/colliders";
import RigidBodyComponent from "../components/rigidbody";

const textureLoader = new THREE.TextureLoader();

export function createFloor(
  world: World,
  physicsWorld: RAPIER.World,
  scene: THREE.Scene,
) {
  const entity = world.createEntity();

  const texture = textureLoader.load(
    "src/assets/textures/blueprint.png",
  );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.repeat.set(10, 10);

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.2, 10),
    new THREE.MeshStandardMaterial({
      color: 0x808080,
      map: texture,
    }),
  );

  mesh.receiveShadow = true;

  scene.add(mesh);

  world.addComponent(
    entity,
    new MeshComponent(mesh),
  );

  const collider = physicsWorld.createCollider(
    RAPIER.ColliderDesc.cuboid(
      5,
      0.1,
      5,
    ),
  );

  world.addComponent(
    entity,
    new CollidersComponent(
      [collider],
    ),
  );

  return entity;
}

export function createPlayer(world: World, physicsWorld: RAPIER.World, scene: THREE.Scene) {
    const entity = world.createEntity();

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x66cc00 }),
    );
    mesh.castShadow = true;
    scene.add(mesh);

    world.addComponent(entity, new MeshComponent(mesh));

    const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 0);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.3);
    const rb = physicsWorld.createRigidBody(rbDesc);
    const collider = physicsWorld.createCollider(colliderDesc, rb);

    world.addComponent(entity, new RigidBodyComponent(rb));
    world.addComponent(entity, new CollidersComponent([collider]));

    return entity;
}