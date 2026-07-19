import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import Collider from '../components/collider';
import RigidBody from '../components/rigidbody';
import {
  GROUP_PLAYER,
  GROUP_VEHICLE,
  GROUP_WHEEL,
  GROUP_WORLD,
  interactionGroups,
} from './physics-groups';
import type Engine from '../engine';
import { resolveSpawnTransform, type SpawnTransform } from '../../utils/spawn-transform';

export async function createFloor(engine: Engine, transform?: SpawnTransform) {
  const { world, physicsWorld, scene, assets } = engine;
  const { position, rotation } = resolveSpawnTransform(transform);

  const size = 1000;
  const texture = await assets.textures.load('src/assets/textures/grid.png');

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.repeat.set(size, size);

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.2, size),
    new THREE.MeshStandardMaterial({
      color: 0x808080,
      map: texture,
    }),
  );

  mesh.position.set(position.x, position.y, position.z);
  mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

  mesh.receiveShadow = true;

  scene.add(mesh);

  const entity = world.createGameObject(mesh);

  const collider = physicsWorld.createCollider(
    RAPIER.ColliderDesc.cuboid(size / 2, 0.1, size / 2)
      .setCollisionGroups(
        interactionGroups(GROUP_WORLD, GROUP_WORLD | GROUP_PLAYER | GROUP_WHEEL | GROUP_VEHICLE),
      )
      .setDensity(1000)
      .setRestitution(0)
      .setTranslation(position.x, position.y, position.z)
      .setRotation(rotation),
  );

  world.addComponent(entity, new Collider(collider));

  return entity;
}

export function createLight(scene: THREE.Scene) {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  light.castShadow = true;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}

export function createCube(engine: Engine, transform?: SpawnTransform) {
  const { world, physicsWorld, scene } = engine;
  const { position, rotation } = resolveSpawnTransform(transform);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x66cc00 }),
  );
  mesh.castShadow = true;
  scene.add(mesh);

  const rbDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setRotation(rotation);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
    .setCollisionGroups(interactionGroups(GROUP_WORLD, GROUP_WORLD | GROUP_PLAYER))
    .setRestitution(0.3);
  const rb = physicsWorld.createRigidBody(rbDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rb);

  const entity = world.createGameObject(mesh);
  world.addComponent(entity, new RigidBody(rb));
  world.addComponent(entity, new Collider(collider));

  return entity;
}
