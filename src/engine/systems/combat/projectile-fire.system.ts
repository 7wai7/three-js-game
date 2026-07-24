import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import type { EntityId } from '../../ecs/types';
import System from '../system';

export default class ProjectileFireSystem extends System {
  update(): void {
    for (const [entity, shotQueue] of this.world.query(ShotQueue, Weapon)) {
      const shots = shotQueue.consumeAll();

      for (let i = 0; i < shots; i += 1) {
        this.spawnProjectile(entity);
      }
    }
  }

  private spawnProjectile(entity: EntityId) {
    console.log('FIRE!', entity);
  }
}
