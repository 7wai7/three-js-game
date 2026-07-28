import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SpinUp from '../../src/engine/components/combat/capabilities/spin-up';
import AutomaticTrigger from '../../src/engine/components/combat/firing-modes/automatic-trigger';
import FireControl from '../../src/engine/components/combat/fire-control';
import FireInput from '../../src/engine/components/combat/fire-input';
import FireRate from '../../src/engine/components/combat/fire-rate';
import Magazine from '../../src/engine/components/combat/magazine';
import BallisticProjectile from '../../src/engine/components/combat/projectiles/ballistic-projectile';
import ProjectileEmitter from '../../src/engine/components/combat/projectiles/projectile-emitter';
import ProjectileShotPattern from '../../src/engine/components/combat/projectiles/projectile-shot-pattern';
import ShotQueue from '../../src/engine/components/combat/shot-queue';
import Weapon from '../../src/engine/components/combat/weapon';
import ControlInput from '../../src/engine/components/control-input';
import EngineContext from '../../src/engine/contexts/engine.context';
import type Engine from '../../src/engine/engine';
import GameWorld from '../../src/engine/game/game-world';
import AutomaticFireSystem from '../../src/engine/systems/combat/automatic-fire.system';
import FireInputSystem from '../../src/engine/systems/combat/fire-input.system';
import ProjectileFireSystem from '../../src/engine/systems/combat/projectile-fire.system';
import ProjectileMotionSystem from '../../src/engine/systems/combat/projectile-motion.system';
import SpinUpSystem from '../../src/engine/systems/combat/spin-up.system';

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function createBulletModel() {
  const bullet = new THREE.Object3D();
  bullet.name = 'Bullet';
  return bullet;
}

function createTestEngineContext(deltaTime = 1 / 60, autoResolveProjectileLoads = true) {
  const world = new GameWorld();
  const loadedProjectileModels = new Set<string>();
  const pendingProjectileLoads = new Map<
    string,
    {
      promise: Promise<void>;
      resolve: () => void;
    }
  >();

  const engine = {
    world,
    scene: new THREE.Scene(),
    assets: {
      gltf: {
        preloadModel: vi.fn((path: string) => {
          if (loadedProjectileModels.has(path)) {
            return Promise.resolve();
          }

          if (autoResolveProjectileLoads) {
            loadedProjectileModels.add(path);
            return Promise.resolve();
          }

          const pending = pendingProjectileLoads.get(path);
          if (pending) {
            return pending.promise;
          }

          let resolveLoad!: () => void;
          const promise = new Promise<void>((resolve) => {
            resolveLoad = () => {
              loadedProjectileModels.add(path);
              pendingProjectileLoads.delete(path);
              resolve();
            };
          });

          pendingProjectileLoads.set(path, {
            promise,
            resolve: resolveLoad,
          });

          return promise;
        }),
        hasModel: vi.fn((path: string) => loadedProjectileModels.has(path)),
        getLoadedModel: vi.fn((path: string) =>
          loadedProjectileModels.has(path)
            ? {
                scene: createBulletModel(),
                scenes: [],
                animations: [],
              }
            : undefined,
        ),
      },
    },
    deltaTime,
  } as unknown as Engine;

  EngineContext.setEngine(engine);

  return {
    engine,
    world,
    resolveProjectileModelLoad(path = 'src/assets/Weapons/Bullet.glb') {
      pendingProjectileLoads.get(path)?.resolve();
    },
  };
}

describe('combat systems', () => {
  let engine: Engine;
  let world: GameWorld;

  beforeEach(() => {
    ({ engine, world } = createTestEngineContext());
  });

  it('fires queued projectile shots without knowing how shooting was started', async () => {
    world.addSystem(new ProjectileFireSystem());

    const weaponObject = new THREE.Object3D();
    const shootPoint = new THREE.Object3D();
    weaponObject.add(shootPoint);

    const entity = world.createGameObject(weaponObject);
    const shotQueue = world.addComponent(entity, new ShotQueue());
    world.addComponent(entity, new Weapon());
    world.addComponent(entity, new ProjectileEmitter({ shootPoints: [shootPoint] }));

    world.update();
    await flushPromises();

    shotQueue.enqueue(2);
    world.update();

    expect(world.query(BallisticProjectile)).toHaveLength(2);
    expect(shotQueue.count).toBe(0);
  });

  it('builds a minigun from fire input, spin-up, automatic fire, and projectile fire', async () => {
    engine.deltaTime = 0.25;

    world.addSystem(new FireInputSystem());
    world.addSystem(new SpinUpSystem());
    world.addSystem(new AutomaticFireSystem());
    world.addSystem(new ProjectileFireSystem());

    const playerObject = new THREE.Object3D();
    const weaponObject = new THREE.Object3D();
    const shootPoint = new THREE.Object3D();
    weaponObject.add(shootPoint);
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
    world.addComponent(minigun, new ProjectileEmitter({ shootPoints: [shootPoint] }));

    world.update();
    await flushPromises();

    world.update();
    world.update();
    world.update();

    expect(spinUp.value).toBe(0.75);
    expect(world.query(BallisticProjectile)).toHaveLength(0);

    world.update();

    expect(spinUp.value).toBe(1);
    expect(world.query(BallisticProjectile)).toHaveLength(5);
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

  it('creates ballistic projectile entities from queued weapon shots', async () => {
    world.addSystem(new ProjectileFireSystem());

    const weaponObject = new THREE.Object3D();
    weaponObject.position.set(1, 2, 3);
    const shootPoint = new THREE.Object3D();
    shootPoint.position.set(0, 0, 1);
    weaponObject.add(shootPoint);

    const weapon = world.createGameObject(weaponObject);
    const shotQueue = world.addComponent(weapon, new ShotQueue());

    world.addComponent(weapon, new Weapon());
    world.addComponent(
      weapon,
      new ProjectileEmitter({
        speed: 25,
        drag: 0.2,
        lifetime: 2,
        shootPoints: [shootPoint],
      }),
    );

    world.update();
    await flushPromises();

    shotQueue.enqueue();
    world.update();

    const [[projectileEntity, projectile]] = world.query(BallisticProjectile);
    const projectileObject = world.getGameObject(projectileEntity);

    expect(projectile.velocity.z).toBe(25);
    expect(projectile.drag).toBe(0.2);
    expect(projectile.lifetime).toBe(2);
    expect(projectileObject.position.toArray()).toEqual([1, 2, 4]);
  });

  it('keeps queued shots until projectile model is loaded', async () => {
    const context = createTestEngineContext(1 / 60, false);
    engine = context.engine;
    world = context.world;

    world.addSystem(new ProjectileFireSystem());

    const weaponObject = new THREE.Object3D();
    const shootPoint = new THREE.Object3D();
    weaponObject.add(shootPoint);

    const weapon = world.createGameObject(weaponObject);
    const shotQueue = world.addComponent(weapon, new ShotQueue());

    world.addComponent(weapon, new Weapon());
    world.addComponent(weapon, new ProjectileEmitter({ shootPoints: [shootPoint] }));

    shotQueue.enqueue(2);
    world.update();
    world.update();

    expect(shotQueue.count).toBe(2);
    expect(world.query(BallisticProjectile)).toHaveLength(0);

    context.resolveProjectileModelLoad();
    await flushPromises();
    world.update();

    expect(shotQueue.count).toBe(0);
    expect(world.query(BallisticProjectile)).toHaveLength(2);
  });

  it('cycles projectile spawn through multiple shoot points', async () => {
    world.addSystem(new ProjectileFireSystem());

    const weaponObject = new THREE.Object3D();
    const leftShootPoint = new THREE.Object3D();
    const rightShootPoint = new THREE.Object3D();

    leftShootPoint.position.set(-1, 0, 0);
    rightShootPoint.position.set(1, 0, 0);
    weaponObject.add(leftShootPoint, rightShootPoint);

    const weapon = world.createGameObject(weaponObject);
    const shotQueue = world.addComponent(weapon, new ShotQueue());

    world.addComponent(weapon, new Weapon());
    world.addComponent(
      weapon,
      new ProjectileEmitter({
        shootPoints: [leftShootPoint, rightShootPoint],
      }),
    );

    world.update();
    await flushPromises();

    shotQueue.enqueue(3);
    world.update();

    const projectiles = world
      .query(BallisticProjectile)
      .map(([entity]) => world.getGameObject(entity).position.x);

    expect(projectiles).toEqual([-1, 1, -1]);
  });

  it('uses a configured shot pattern to spawn projectiles from specific shoot points', async () => {
    world.addSystem(new ProjectileFireSystem());

    const weaponObject = new THREE.Object3D();
    const leftShootPoint = new THREE.Object3D();
    const centerShootPoint = new THREE.Object3D();
    const rightShootPoint = new THREE.Object3D();

    leftShootPoint.position.set(-1, 0, 0);
    centerShootPoint.position.set(0, 0, 0);
    rightShootPoint.position.set(1, 0, 0);
    weaponObject.add(leftShootPoint, centerShootPoint, rightShootPoint);

    const weapon = world.createGameObject(weaponObject);
    const shotQueue = world.addComponent(weapon, new ShotQueue());

    world.addComponent(weapon, new Weapon());
    world.addComponent(
      weapon,
      new ProjectileEmitter({
        shootPoints: [leftShootPoint, centerShootPoint, rightShootPoint],
      }),
    );
    world.addComponent(
      weapon,
      new ProjectileShotPattern({
        shotsPerTrigger: 2,
        shootPointIndices: [2, 0],
      }),
    );

    world.update();
    await flushPromises();

    shotQueue.enqueue(1);
    world.update();

    const projectiles = world
      .query(BallisticProjectile)
      .map(([entity]) => world.getGameObject(entity).position.x);

    expect(projectiles).toEqual([1, -1]);
  });

  it('moves ballistic projectiles with gravity and air drag', () => {
    engine.deltaTime = 1;

    world.addSystem(new ProjectileMotionSystem());

    const object = new THREE.Object3D();
    const projectileEntity = world.createGameObject(object);
    const projectile = world.addComponent(
      projectileEntity,
      new BallisticProjectile({
        velocity: new THREE.Vector3(10, 10, 0),
        gravity: new THREE.Vector3(0, -10, 0),
        drag: 0,
        lifetime: 5,
      }),
    );

    world.update();
    world.update();

    expect(projectile.velocity.toArray()).toEqual([10, 0, 0]);
    expect(object.position.toArray()).toEqual([10, 0, 0]);

    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(object.quaternion);
    expect(facing.x).toBeCloseTo(1);
    expect(facing.y).toBeCloseTo(0);
    expect(facing.z).toBeCloseTo(0);
  });
});
