import { describe, it, expect, vi } from 'vitest';

import type RAPIER from '@dimforge/rapier3d';

import World from '../../src/engine/ecs/world';
import Component from '../../src/engine/ecs/component';
import RigidBody from '../../src/engine/components/rigidbody';
import Colliders from '../../src/engine/components/colliders';
import AutomaticTrigger from '../../src/engine/components/combat/firing-modes/automatic-trigger';
import FireRate from '../../src/engine/components/combat/fire-rate';
import ShotQueue from '../../src/engine/components/combat/shot-queue';
import { RequireComponent } from '../../src/engine/ecs/require-component';

describe('ecs tests', () => {
  it('returns entities with required components', () => {
    const world = new World();

    const entity = world.createEntity('test');

    const mockRigidBody = {} as RAPIER.RigidBody;
    const mockCollider = {} as RAPIER.Collider;

    world.addComponent(entity, new RigidBody(mockRigidBody));
    world.addComponent(entity, new Colliders([mockCollider]));

    const entities = world.entitiesWith(RigidBody, Colliders);

    expect([...entities]).toEqual([entity]);
  });

  it('returns query tuples with entity and components in requested order', () => {
    const world = new World();

    const matchingEntity = world.createEntity('matching');
    const missingColliderEntity = world.createEntity('missing-collider');

    const rigidBody = new RigidBody({} as RAPIER.RigidBody);
    const colliders = new Colliders([{} as RAPIER.Collider]);

    world.addComponent(matchingEntity, rigidBody);
    world.addComponent(matchingEntity, colliders);
    world.addComponent(missingColliderEntity, new RigidBody({} as RAPIER.RigidBody));

    const results = world.query(RigidBody, Colliders);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([matchingEntity, rigidBody, colliders]);
  });

  it('returns components from entity list in requested component order', () => {
    const world = new World();

    const first = world.createEntity('first');
    const second = world.createEntity('second');

    const colliders = world.addComponent(first, new Colliders([{} as RAPIER.Collider]));
    const rigidBody = world.addComponent(second, new RigidBody({} as RAPIER.RigidBody));

    const result = world.getComponentsFromEntities([first, second], RigidBody, Colliders);

    expect(result).toEqual([rigidBody, colliders]);
  });

  it('can find ordered components from a single-use entity iterator', () => {
    const world = new World();
    const entitiesByName = new Map<string, string>();

    const first = world.createEntity('first');
    const second = world.createEntity('second');
    entitiesByName.set('first', first);
    entitiesByName.set('second', second);

    const colliders = world.addComponent(first, new Colliders([{} as RAPIER.Collider]));
    const rigidBody = world.addComponent(second, new RigidBody({} as RAPIER.RigidBody));

    const result = world.getComponentsFromEntities(
      Array.from(entitiesByName.values()),
      RigidBody,
      Colliders,
    );

    expect(result).toEqual([rigidBody, colliders]);
  });

  it('throws when requested component is not found in entity list', () => {
    const world = new World();
    const entity = world.createEntity('entity');

    world.addComponent(entity, new RigidBody({} as RAPIER.RigidBody));

    expect(() => world.getComponentsFromEntities([entity], RigidBody, Colliders)).toThrow(
      'Component "Colliders" not found in provided entities',
    );
  });

  it('warns when replacing an existing component on the same entity', () => {
    const world = new World();
    const entity = world.createEntity('entity');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    world.addComponent(entity, new Colliders([{} as RAPIER.Collider]));
    world.addComponent(entity, new Colliders([{} as RAPIER.Collider]));

    expect(warn).toHaveBeenCalledWith(
      'Component "Colliders" is already attached to entity "entity" and will be replaced',
    );

    warn.mockRestore();
  });

  it('does not validate required components until the entity is checked', () => {
    const world = new World();
    const entity = world.createEntity('weapon');

    expect(() => world.addComponent(entity, new AutomaticTrigger())).not.toThrow();

    expect(() => world.validateComponentRequirements()).toThrow(
      'Component "AutomaticTrigger" on entity "weapon" is missing required component(s): FireRate, ShotQueue',
    );
  });

  it('allows required components to be assembled in any order before validation', () => {
    const world = new World();
    const entity = world.createEntity('weapon');

    const trigger = world.addComponent(entity, new AutomaticTrigger());
    world.addComponent(entity, new FireRate(10));
    world.addComponent(entity, new ShotQueue());

    expect(() => world.validateComponentRequirements()).not.toThrow();

    expect(trigger).toBeInstanceOf(AutomaticTrigger);
  });

  it('allows components to require each other when both exist before validation', () => {
    class CyclicA extends Component {}
    class CyclicB extends Component {}

    RequireComponent(CyclicB)(CyclicA);
    RequireComponent(CyclicA)(CyclicB);

    const world = new World();
    const entity = world.createEntity('cyclic');

    world.addComponent(entity, new CyclicA());
    world.addComponent(entity, new CyclicB());

    expect(() => world.validateComponentRequirements()).not.toThrow();
  });
});
