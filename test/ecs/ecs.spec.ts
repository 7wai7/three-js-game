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

  it('returns query tuples with entity and components in requested order', () => {
    const world = new World();

    const matchingEntity = world.createEntity('matching');
    const missingColliderEntity = world.createEntity('missing-collider');

    const rigidBody = new RigidBody({} as RAPIER.RigidBody);
    const collider = new Collider({} as RAPIER.Collider);

    world.addComponent(matchingEntity, rigidBody);
    world.addComponent(matchingEntity, collider);
    world.addComponent(missingColliderEntity, new RigidBody({} as RAPIER.RigidBody));

    const results = world.query(RigidBody, Collider);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([matchingEntity, rigidBody, collider]);
  });
});
