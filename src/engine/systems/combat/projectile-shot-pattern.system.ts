import AlternatingProjectileShotPattern from '../../components/combat/projectiles/shot-patterns/alternating-projectile-shot-pattern';
import ProjectileVolleyShotPattern from '../../components/combat/projectiles/shot-patterns/projectile-volley-shot-pattern';
import SingleProjectileShotPattern from '../../components/combat/projectiles/shot-patterns/single-projectile-shot-pattern';
import ProjectileEmitter from '../../components/combat/projectiles/projectile-emitter';
import ProjectileSpawnQueue from '../../components/combat/projectiles/projectile-spawn-queue';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import type { EntityId } from '../../ecs/types';
import System from '../system';

export default class ProjectileShotPatternSystem extends System {
  update(): void {
    this.queueSingleShots();
    this.queueAlternatingShots();
    this.queueVolleyShots();
    this.queueDefaultShots();
  }

  private queueSingleShots() {
    for (const [, shotQueue, spawnQueue, pattern] of this.world.query(
      ShotQueue,
      ProjectileSpawnQueue,
      SingleProjectileShotPattern,
      Weapon,
    )) {
      const shots = shotQueue.consumeAll();

      for (let i = 0; i < shots; i += 1) {
        spawnQueue.enqueue(pattern.shootPointIndex);
      }
    }
  }

  private queueAlternatingShots() {
    for (const [, shotQueue, spawnQueue, pattern, emitter] of this.world.query(
      ShotQueue,
      ProjectileSpawnQueue,
      AlternatingProjectileShotPattern,
      ProjectileEmitter,
      Weapon,
    )) {
      const shots = shotQueue.consumeAll();
      const projectilesPerShot = Math.max(pattern.projectilesPerShot, 1);

      for (let shotIndex = 0; shotIndex < shots; shotIndex += 1) {
        for (let projectileIndex = 0; projectileIndex < projectilesPerShot; projectileIndex += 1) {
          const shootPointIndex = this.nextAlternatingShootPointIndex(pattern, emitter);
          if (shootPointIndex !== undefined) {
            spawnQueue.enqueue(shootPointIndex);
          }
        }
      }
    }
  }

  private queueVolleyShots() {
    for (const [, shotQueue, spawnQueue, pattern, emitter] of this.world.query(
      ShotQueue,
      ProjectileSpawnQueue,
      ProjectileVolleyShotPattern,
      ProjectileEmitter,
      Weapon,
    )) {
      const shots = shotQueue.consumeAll();

      for (let shotIndex = 0; shotIndex < shots; shotIndex += 1) {
        for (const shootPointIndex of this.nextVolleyGroup(pattern, emitter)) {
          spawnQueue.enqueue(shootPointIndex);
        }
      }
    }
  }

  private queueDefaultShots() {
    for (const [entity, shotQueue, spawnQueue] of this.world.query(
      ShotQueue,
      ProjectileSpawnQueue,
      ProjectileEmitter,
      Weapon,
    )) {
      if (this.hasExplicitPattern(entity)) {
        continue;
      }

      const shots = shotQueue.consumeAll();

      for (let i = 0; i < shots; i += 1) {
        spawnQueue.enqueue();
      }
    }
  }

  private nextAlternatingShootPointIndex(
    pattern: AlternatingProjectileShotPattern,
    emitter: ProjectileEmitter,
  ) {
    const shootPointIndices =
      pattern.shootPointIndices.length > 0
        ? pattern.shootPointIndices
        : emitter.shootPoints.map((_, index) => index);

    if (shootPointIndices.length === 0) {
      return;
    }

    const shootPointIndex =
      shootPointIndices[pattern.nextShootPointIndex % shootPointIndices.length];
    pattern.nextShootPointIndex = (pattern.nextShootPointIndex + 1) % shootPointIndices.length;

    return shootPointIndex;
  }

  private nextVolleyGroup(
    pattern: ProjectileVolleyShotPattern,
    emitter: ProjectileEmitter,
  ): number[] {
    if (pattern.groups.length === 0) {
      return emitter.shootPoints.map((_, index) => index);
    }

    const group = pattern.groups[pattern.nextGroupIndex % pattern.groups.length];
    pattern.nextGroupIndex = (pattern.nextGroupIndex + 1) % pattern.groups.length;

    return group;
  }

  private hasExplicitPattern(entity: EntityId) {
    return (
      Boolean(this.world.getComponent(entity, SingleProjectileShotPattern)) ||
      Boolean(this.world.getComponent(entity, AlternatingProjectileShotPattern)) ||
      Boolean(this.world.getComponent(entity, ProjectileVolleyShotPattern))
    );
  }
}
