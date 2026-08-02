import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import AimAtTarget from '../../src/engine/components/transform/aim-at-target';
import EngineContext from '../../src/engine/contexts/engine.context';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import AimAtTargetSystem from '../../src/engine/systems/transform/aim-at-target.system';

function createTestEngineContext(deltaTime = 1 / 60) {
  const world = new GameWorld();
  const engine = {
    world,
    deltaTime,
  } as unknown as Engine;

  EngineContext.setEngine(engine);

  return {
    engine,
    world,
  };
}

function updateSystem(world: GameWorld) {
  world.update();
  world.update();
}

describe('AimAtTargetSystem', () => {
  it('rotates an object toward a target around local Y axis', () => {
    const { world } = createTestEngineContext();
    world.addSystem(new AimAtTargetSystem());

    const object = new THREE.Object3D();
    const target = new THREE.Object3D();
    target.position.set(10, 0, 0);

    const entity = world.createGameObject(object);
    world.addComponent(entity, new AimAtTarget({ targetObject: target }));

    updateSystem(world);

    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(object.quaternion);

    expect(facing.x).toBeCloseTo(1);
    expect(facing.y).toBeCloseTo(0);
    expect(facing.z).toBeCloseTo(0);
  });

  it('can rotate an object around local Z axis for rig-specific pivots', () => {
    const { world } = createTestEngineContext();
    world.addSystem(new AimAtTargetSystem());

    const object = new THREE.Object3D();
    const target = new THREE.Object3D();
    target.position.set(0, 10, 0);

    const entity = world.createGameObject(object);
    world.addComponent(
      entity,
      new AimAtTarget({
        targetObject: target,
        rotationAxis: new THREE.Vector3(0, 0, 1),
        forwardAxis: new THREE.Vector3(1, 0, 0),
      }),
    );

    updateSystem(world);

    const facing = new THREE.Vector3(1, 0, 0).applyQuaternion(object.quaternion);

    expect(facing.x).toBeCloseTo(0);
    expect(facing.y).toBeCloseTo(1);
    expect(facing.z).toBeCloseTo(0);
  });

  it('can limit rotation speed', () => {
    const { world } = createTestEngineContext(0.5);
    world.addSystem(new AimAtTargetSystem());

    const object = new THREE.Object3D();
    const target = new THREE.Object3D();
    target.position.set(10, 0, 0);

    const entity = world.createGameObject(object);
    world.addComponent(
      entity,
      new AimAtTarget({
        targetObject: target,
        maxAngularSpeed: Math.PI / 2,
      }),
    );

    updateSystem(world);

    expect(object.rotation.y).toBeCloseTo(Math.PI / 4);
  });

  it('clamps rotation to configured angle limits', () => {
    const { world } = createTestEngineContext();
    world.addSystem(new AimAtTargetSystem());

    const object = new THREE.Object3D();
    const target = new THREE.Object3D();
    target.position.set(10, 0, 0);

    const entity = world.createGameObject(object);
    const aim = world.addComponent(
      entity,
      new AimAtTarget({
        targetObject: target,
        minAngle: -Math.PI / 6,
        maxAngle: Math.PI / 4,
      }),
    );

    updateSystem(world);

    expect(aim.currentAngle).toBeCloseTo(Math.PI / 4);
    expect(object.rotation.y).toBeCloseTo(Math.PI / 4);
  });

  it('clamps rotation to negative angle limits', () => {
    const { world } = createTestEngineContext();
    world.addSystem(new AimAtTargetSystem());

    const object = new THREE.Object3D();
    const target = new THREE.Object3D();
    target.position.set(-10, 0, 0);

    const entity = world.createGameObject(object);
    const aim = world.addComponent(
      entity,
      new AimAtTarget({
        targetObject: target,
        minAngle: -Math.PI / 6,
        maxAngle: Math.PI / 4,
      }),
    );

    updateSystem(world);

    expect(aim.currentAngle).toBeCloseTo(-Math.PI / 6);
    expect(object.rotation.y).toBeCloseTo(-Math.PI / 6);
  });
});
