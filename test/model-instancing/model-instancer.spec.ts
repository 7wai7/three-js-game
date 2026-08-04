import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d/rapier.js';
import { describe, expect, it, vi } from 'vitest';

import Colliders from '../../src/engine/components/colliders';
import RigidBody from '../../src/engine/components/rigidbody';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import ModelInstancer from '../../src/engine/model-instancing/instancing';
import type { ModelConfig } from '../../src/engine/model-instancing/config-types';

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
          collider: {
            source: 'COL_trigger',
            rigidBodyType: 'NONE',
            shape: 'BOX',
          },
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

  it('keeps creating a rigidbody for existing collider configs by default', async () => {
    const model = new THREE.Group();
    const body = new THREE.Object3D();
    const colliderSource = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    body.name = 'Body';
    colliderSource.name = 'COL_body';
    body.add(colliderSource);
    model.add(body);

    const { engine, world } = createTestEngine(model);
    const instancer = new ModelInstancer(engine);
    const config: ModelConfig = {
      modelPath: 'body.glb',
      entities: {
        Body: {
          collider: {
            source: 'COL_body',
            shape: 'BOX',
          },
        },
      },
    };

    const { entities } = await instancer.instance(config);
    const [entity] = [...entities];

    expect(world.getComponent(entity, Colliders)).toBeInstanceOf(Colliders);
    expect(world.getComponent(entity, RigidBody)).toBeInstanceOf(RigidBody);
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
    expect(world.getComponent(entity, RigidBody)).toBeInstanceOf(RigidBody);
    expect(nodesByName.get('Body')?.colliders).toEqual(colliders?.colliders);
    expect(leftColliderSource.visible).toBe(false);
    expect(rightColliderSource.visible).toBe(false);
  });
});
