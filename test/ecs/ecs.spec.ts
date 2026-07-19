import { describe, it, expect } from 'vitest';

import type RAPIER from '@dimforge/rapier3d';

import World from '../../src/engine/ecs/world';
import RigidBody from '../../src/engine/components/rigidbody';
import Collider from '../../src/engine/components/collider';

describe('ecs tests', () => {
  it('returns entities with required components', () => {
    const world = new World();

    const entity = world.createEntity('test');

    const mockRigidBody = {} as RAPIER.RigidBody;
    const mockCollider = {} as RAPIER.Collider;

    world.addComponent(entity, new RigidBody(mockRigidBody));
    world.addComponent(entity, new Collider(mockCollider));

    const entities = world.entitiesWith(RigidBody, Collider);

    expect([...entities]).toEqual([entity]);
  });
});
