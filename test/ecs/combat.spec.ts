import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SpinUp from '../../src/engine/components/combat/capabilities/spin-up';
import AutomaticTrigger from '../../src/engine/components/combat/firing-modes/automatic-trigger';
import FireControl from '../../src/engine/components/combat/fire-control';
import FireInput from '../../src/engine/components/combat/fire-input';
import FireRate from '../../src/engine/components/combat/fire-rate';
import Magazine from '../../src/engine/components/combat/magazine';
import ShotQueue from '../../src/engine/components/combat/shot-queue';
import Weapon from '../../src/engine/components/combat/weapon';
import ControlInput from '../../src/engine/components/control-input';
import EngineContext from '../../src/engine/contexts/engine.context';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import AutomaticFireSystem from '../../src/engine/systems/combat/automatic-fire.system';
import FireInputSystem from '../../src/engine/systems/combat/fire-input.system';
import ProjectileFireSystem from '../../src/engine/systems/combat/projectile-fire.system';
import SpinUpSystem from '../../src/engine/systems/combat/spin-up.system';

function createTestEngineContext(deltaTime = 1 / 60) {
  const world = new GameWorld();
  const engine = {
    world,
    deltaTime,
  } as Engine;

  EngineContext.setEngine(engine);

  return {
    engine,
    world,
  };
}

describe('combat systems', () => {
  let engine: Engine;
  let world: GameWorld;

  beforeEach(() => {
    ({ engine, world } = createTestEngineContext());
  });

  it('fires queued projectile shots without knowing how shooting was started', () => {
    const projectileFireSystem = new ProjectileFireSystem();

    const spawnProjectile = vi
      .spyOn(
        projectileFireSystem as unknown as {
          spawnProjectile(entity: string): void;
        },
        'spawnProjectile',
      )
      .mockImplementation(() => {});

    world.addSystem(projectileFireSystem);

    const entity = world.createEntity('weapon');
    const shotQueue = world.addComponent(entity, new ShotQueue());
    world.addComponent(entity, new Weapon());

    world.update();

    shotQueue.enqueue(2);
    world.update();

    expect(spawnProjectile).toHaveBeenCalledTimes(2);
    expect(spawnProjectile).toHaveBeenNthCalledWith(1, entity);
    expect(spawnProjectile).toHaveBeenNthCalledWith(2, entity);
    expect(shotQueue.count).toBe(0);
  });

  it('builds a minigun from fire input, spin-up, automatic fire, and projectile fire', () => {
    engine.deltaTime = 0.25;

    const projectileFireSystem = new ProjectileFireSystem();

    const spawnProjectile = vi
      .spyOn(
        projectileFireSystem as unknown as {
          spawnProjectile(entity: string): void;
        },
        'spawnProjectile',
      )
      .mockImplementation(() => {});

    world.addSystem(new FireInputSystem());
    world.addSystem(new SpinUpSystem());
    world.addSystem(new AutomaticFireSystem());
    world.addSystem(projectileFireSystem);

    const playerObject = new THREE.Object3D();
    const weaponObject = new THREE.Object3D();
    playerObject.add(weaponObject);

    const player = world.createGameObject(playerObject);
    const minigun = world.createGameObject(weaponObject);

    const input = world.addComponent(player, new ControlInput());
    input.setButton('firePrimary', {
      pressed: true,
      clicked: true,
      released: false,
    });

    world.addComponent(minigun, new Weapon());
    world.addComponent(minigun, new FireInput());
    world.addComponent(minigun, new FireControl());
    const spinUp = world.addComponent(
      minigun,
      new SpinUp({
        spinUpTime: 1,
        spinDownTime: 1,
        minFireSpin: 1,
      }),
    );
    world.addComponent(minigun, new AutomaticTrigger());
    world.addComponent(minigun, new FireRate(20));
    world.addComponent(minigun, new Magazine(10));
    world.addComponent(minigun, new ShotQueue());

    world.update();

    world.update();
    world.update();
    world.update();

    expect(spinUp.value).toBe(0.75);
    expect(spawnProjectile).not.toHaveBeenCalled();

    world.update();

    expect(spinUp.value).toBe(1);
    expect(spawnProjectile).toHaveBeenCalledTimes(5);
    expect(spawnProjectile).toHaveBeenCalledWith(minigun);
  });

  it('can enqueue multiple automatic shots in one frame', () => {
    engine.deltaTime = 1 / 60;

    world.addSystem(new AutomaticFireSystem());

    const entity = world.createEntity('weapon');
    const fireControl = world.addComponent(entity, new FireControl());
    const shotQueue = world.addComponent(entity, new ShotQueue());
    const magazine = world.addComponent(entity, new Magazine(1000));

    world.addComponent(entity, new Weapon());
    world.addComponent(entity, new AutomaticTrigger());
    world.addComponent(entity, new FireRate(1000));

    fireControl.setActive(true);

    world.update();
    world.update();

    expect(shotQueue.count).toBe(16);
    expect(magazine.ammo).toBe(984);
  });
});
