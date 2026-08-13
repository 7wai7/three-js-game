import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d/rapier.js';
import { describe, expect, it, vi } from 'vitest';

import Colliders from '../../src/engine/components/colliders';
import RigidBody from '../../src/engine/components/rigidbody';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import ModelInstancer from '../../src/engine/model-instancing/instancing';
import type { ModelConfig } from '../../src/engine/model-instancing/config-types';

function expectVectorCloseTo(
  actual: { x: number; y: number; z: number } | undefined,
  expected: THREE.Vector3,
) {
  expect(actual?.x).toBeCloseTo(expected.x);
  expect(actual?.y).toBeCloseTo(expected.y);
  expect(actual?.z).toBeCloseTo(expected.z);
}

function createTestEngine(model: THREE.Object3D) {
  const world = new GameWorld();
  const scene = new THREE.Scene();
  const physicsWorld = new RAPIER.World({
    x: 0,
    y: -9.81,
    z: 0,
  });
  const loadModel = vi.fn(async () => ({
    scene: model,
    scenes: [model],
    animations: [],
  }));

  const engine = {
    world,
    scene,
    physicsWorld,
    assets: {
      gltf: {
        loadModel,
      },
    },
  } as unknown as Engine;

  return {
    engine,
    world,
    scene,
    physicsWorld,
    loadModel,
  };
}

describe('ModelInstancer', () => {
  it('can create a standalone collider without a rigidbody', async () => {
    const model = new THREE.Group();
    const trigger = new THREE.Object3D();
    const colliderSource = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6));

    trigger.name = 'Trigger';
    trigger.position.set(1, 2, 3);
    colliderSource.name = 'COL_trigger';
    colliderSource.position.set(0, 1, 0);

    trigger.add(colliderSource);
    model.add(trigger);

    const { engine, world, scene } = createTestEngine(model);
    const instancer = new ModelInstancer(engine);
    const config: ModelConfig = {
      modelPath: 'trigger.glb',
      entities: {
        Trigger: {
          colliders: [
            {
              source: 'COL_trigger',
              shape: 'BOX',
            },
          ],
        },
      },
    };

    const { entities, nodesByName } = await instancer.instance(config);
    const [entity] = [...entities];
    const colliders = world.getComponent(entity, Colliders);

    expect(scene.children).toContain(model);
    expect(colliders).toBeInstanceOf(Colliders);
    expect(world.getComponent(entity, RigidBody)).toBeUndefined();
    expect(nodesByName.get('Trigger')?.rigidBody).toBeUndefined();
    expect(nodesByName.get('Trigger')?.colliders).toEqual(colliders?.colliders);
    expect(colliderSource.visible).toBe(false);
    expect(colliders?.primary.translation()).toMatchObject({
      x: 1,
      y: 3,
      z: 3,
    });
  });

  it('can create a rigidbody without colliders', async () => {
    const model = new THREE.Group();
    const body = new THREE.Object3D();

    body.name = 'Body';
    body.position.set(2, 3, 4);
    model.add(body);

    const { engine, world } = createTestEngine(model);
    const instancer = new ModelInstancer(engine);
    const config: ModelConfig = {
      modelPath: 'body.glb',
      entities: {
        Body: {
          rigidBody: {
            type: 'KINEMATIC',
            mass: 400,
          },
        },
      },
    };

    const { entities, nodesByName } = await instancer.instance(config);
    const [entity] = [...entities];
    const rigidBody = world.getComponent(entity, RigidBody);

    expect(rigidBody).toBeInstanceOf(RigidBody);
    expect(world.getComponent(entity, Colliders)).toBeUndefined();
    expect(nodesByName.get('Body')?.rigidBody).toBe(rigidBody?.rigidBody);
    expect(nodesByName.get('Body')?.colliders).toBeUndefined();
    expect(rigidBody?.rigidBody.translation()).toMatchObject({
      x: 2,
      y: 3,
      z: 4,
    });
  });

  it('can create multiple colliders for one entity from config', async () => {
    const model = new THREE.Group();
    const body = new THREE.Object3D();
    const leftColliderSource = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    const rightColliderSource = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    body.name = 'Body';
    leftColliderSource.name = 'COL_body_left';
    rightColliderSource.name = 'COL_body_right';
    leftColliderSource.position.set(-1, 0, 0);
    rightColliderSource.position.set(1, 0, 0);

    body.add(leftColliderSource, rightColliderSource);
    model.add(body);

    const { engine, world } = createTestEngine(model);
    const instancer = new ModelInstancer(engine);
    const config: ModelConfig = {
      modelPath: 'body.glb',
      entities: {
        Body: {
          colliders: [
            {
              source: 'COL_body_left',
              shape: 'BOX',
            },
            {
              source: 'COL_body_right',
              shape: 'BOX',
            },
          ],
        },
      },
    };

    const { entities, nodesByName } = await instancer.instance(config);
    const [entity] = [...entities];
    const colliders = world.getComponent(entity, Colliders);

    expect(colliders?.colliders).toHaveLength(2);
    expect(world.getComponent(entity, RigidBody)).toBeUndefined();
    expect(nodesByName.get('Body')?.colliders).toEqual(colliders?.colliders);
    expect(leftColliderSource.visible).toBe(false);
    expect(rightColliderSource.visible).toBe(false);
  });

  it('applies spawn transform before creating rigidbodies and joints', async () => {
    const model = new THREE.Group();
    const chassis = new THREE.Object3D();
    const wheel = new THREE.Object3D();
    const pivot = new THREE.Object3D();

    chassis.name = 'Chassis';
    wheel.name = 'Wheel';
    pivot.name = 'WheelPivot';
    wheel.position.set(2, 0, 0);
    pivot.position.set(1, 0, 0);

    model.add(chassis, wheel, pivot);

    const { engine, physicsWorld } = createTestEngine(model);
    const instancer = new ModelInstancer(engine);
    const config: ModelConfig = {
      modelPath: 'vehicle.glb',
      entities: {
        Chassis: {
          rigidBody: {
            type: 'DYNAMIC',
          },
        },
        Wheel: {
          rigidBody: {
            type: 'DYNAMIC',
          },
        },
      },
      joints: [
        {
          type: 'revolute',
          bodyA: 'Chassis',
          bodyB: 'Wheel',
          anchor: 'WheelPivot',
          axis: { x: 1 },
        },
      ],
    };

    const spawnPosition = new THREE.Vector3(10, 5, 20);
    const spawnRotation = new THREE.Euler(0, Math.PI / 2, 0);
    const spawnQuaternion = new THREE.Quaternion().setFromEuler(spawnRotation);

    const { nodesByName } = await instancer.instance(config, {
      position: spawnPosition,
      rotation: spawnRotation,
    });

    const expectedChassisPosition = new THREE.Vector3(0, 0, 0)
      .applyQuaternion(spawnQuaternion)
      .add(spawnPosition);
    const expectedWheelPosition = new THREE.Vector3(2, 0, 0)
      .applyQuaternion(spawnQuaternion)
      .add(spawnPosition);

    expectVectorCloseTo(
      nodesByName.get('Chassis')?.rigidBody?.translation(),
      expectedChassisPosition,
    );
    expectVectorCloseTo(nodesByName.get('Wheel')?.rigidBody?.translation(), expectedWheelPosition);

    const joints: RAPIER.ImpulseJoint[] = [];
    physicsWorld.impulseJoints.forEach((joint) => joints.push(joint));

    expect(joints).toHaveLength(1);
    expectVectorCloseTo(joints[0]?.anchor1(), new THREE.Vector3(1, 0, 0));
    expectVectorCloseTo(joints[0]?.anchor2(), new THREE.Vector3(-1, 0, 0));
  });
});
