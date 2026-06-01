import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import Object3DComponent from "../components/object";
import ColliderComponent from "../components/collider";
import RigidBodyComponent from "../components/rigidbody";
import { GROUP_PLAYER, GROUP_WORLD, interactionGroups } from "./physics-groups";
import type Engine from "../engine";
import { resolveSpawnTransform, type SpawnTransform } from "../../utils/spawn-transform";

export async function createFloor(
  engine: Engine,
) {
  const { world, physicsWorld, scene, assets } = engine;
  const entity = world.createEntity();

  const texture = await assets.textures.load("src/assets/textures/grid.png");

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
    new Object3DComponent(mesh),
  );

  const collider = physicsWorld.createCollider(
    RAPIER.ColliderDesc.cuboid(
      5,
      0.1,
      5,
    )
      .setCollisionGroups(
        interactionGroups(
          GROUP_WORLD,
          GROUP_WORLD | GROUP_PLAYER,
        ),
      )
  );

  world.addComponent(
    entity,
    new ColliderComponent(
      collider,
    ),
  );

  return entity;
}

export function createLight(
  scene: THREE.Scene,
) {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  light.castShadow = true;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}

export function createCube(
  engine: Engine,
  transform?: SpawnTransform
) {
  const { world, physicsWorld, scene } = engine;
  const { position, rotation } = resolveSpawnTransform(transform);

  const entity = world.createEntity();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x66cc00 }),
  );
  mesh.castShadow = true;
  scene.add(mesh);

  const rbDesc = RAPIER.RigidBodyDesc
    .dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setRotation(rotation);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
    .setCollisionGroups(
      interactionGroups(
        GROUP_WORLD,
        GROUP_WORLD | GROUP_PLAYER,
      ),
    )
    .setRestitution(0.3);
  const rb = physicsWorld.createRigidBody(rbDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rb);

  world.addComponent(entity, new Object3DComponent(mesh));
  world.addComponent(entity, new RigidBodyComponent(rb));
  world.addComponent(entity, new ColliderComponent(collider));

  return entity;
}