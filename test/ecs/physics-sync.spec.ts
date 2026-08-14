import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d/rapier.js';
import { beforeEach, describe, expect, it } from 'vitest';

import RigidBody from '../../src/engine/components/rigidbody';
import EngineContext from '../../src/engine/contexts/engine.context';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import PhysicsSyncSystem from '../../src/engine/systems/physics-sync.system';

function expectVectorCloseTo(actual: THREE.Vector3, expected: THREE.Vector3) {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.z).toBeCloseTo(expected.z);
}

function expectQuaternionCloseTo(actual: THREE.Quaternion, expected: THREE.Quaternion) {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.z).toBeCloseTo(expected.z);
  expect(actual.w).toBeCloseTo(expected.w);
}

describe('PhysicsSyncSystem', () => {
  let world: GameWorld;
  let physicsWorld: RAPIER.World;
  let system: PhysicsSyncSystem;

  beforeEach(() => {
    world = new GameWorld();
    physicsWorld = new RAPIER.World({
      x: 0,
      y: -9.81,
      z: 0,
    });
    system = new PhysicsSyncSystem();

    EngineContext.setEngine({
      world,
      physicsWorld,
      deltaTime: 0,
    } as Engine);
  });

  it('syncs a rigidbody world transform into local object transform under a parent', () => {
    const parent = new THREE.Object3D();
    const child = new THREE.Object3D();
    const parentRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
    const rigidBodyRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.PI / 4, Math.PI / 2, 0),
    );
    const rigidBodyPosition = new THREE.Vector3(10, 5, 20);

    parent.position.set(7, 1, 3);
    parent.quaternion.copy(parentRotation);
    parent.add(child);

    const rigidBody = physicsWorld.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(rigidBodyPosition.x, rigidBodyPosition.y, rigidBodyPosition.z)
        .setRotation(rigidBodyRotation),
    );

    const entity = world.createGameObject(child);
    world.addComponent(entity, new RigidBody(rigidBody));

    system.preRender();
    child.updateMatrixWorld(true);

    const childWorldPosition = new THREE.Vector3();
    const childWorldQuaternion = new THREE.Quaternion();

    child.getWorldPosition(childWorldPosition);
    child.getWorldQuaternion(childWorldQuaternion);

    expectVectorCloseTo(childWorldPosition, rigidBodyPosition);
    expectQuaternionCloseTo(childWorldQuaternion, rigidBodyRotation);
  });
});
