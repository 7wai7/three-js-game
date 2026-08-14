import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import Colliders from '../components/colliders';
import type Engine from '../engine';
import {
  GROUP_PLAYER,
  GROUP_VEHICLE,
  GROUP_WHEEL,
  GROUP_WORLD,
  interactionGroups,
} from './physics-groups';
import { createCube } from './terrain-primitives/cube';
import { createCylinder } from './terrain-primitives/cylinder';
import { createRamp } from './terrain-primitives/ramp';

export { createBox, createCube } from './terrain-primitives/cube';
export { createCylinder } from './terrain-primitives/cylinder';
export { createSphere } from './terrain-primitives/sphere';
export { createRamp } from './terrain-primitives/ramp';
export type {
  CubeOptions,
  CylinderOptions,
  PrimitiveOptions,
  PrimitiveRigidBodyType,
  RampOptions,
  SphereOptions,
} from './terrain-primitives/types';

export async function createFloor(engine: Engine) {
  const { world, physicsWorld, scene, assets } = engine;

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

  mesh.position.set(0, -0.1, 0);

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
      .setTranslation(0, -0.1, 0),
  );

  world.addComponent(entity, new Colliders([collider]));

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

export function createTestTerrain(engine: Engine) {
  createFloor(engine);

  createLight(engine.scene);

  createCube(engine, {
    position: new THREE.Vector3(-17, 1, 5),
    restitution: 0,
    width: 0.2,
    height: 2,
    depth: 3,
    rigidBodyType: 'fixed',
  });

  createCylinder(engine, {
    position: new THREE.Vector3(0, -0.35, 10),
    rotation: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
    radius: 0.4,
    height: 5,
    rigidBodyType: 'fixed',
  });

  createRamp(engine, {
    position: new THREE.Vector3(0, 0, 12),
    length: 12,
    width: 5,
    height: 3,
    bend: 0.6,
    segments: 24,
    rigidBodyType: 'fixed',
  });
}
