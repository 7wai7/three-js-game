import Magazine from '../../components/combat/magazine';
import Reloadable from '../../components/combat/capabilities/reloadable';
import System from '../system';

export default class ReloadSystem extends System {
  update(): void {
    const entities = this.world.entitiesWith(Reloadable, Magazine);

    for (const entity of entities) {
      const reload = this.world.getComponent(entity, Reloadable)!;

      if (!reload.active) continue;

      const magazine = this.world.getComponent(entity, Magazine)!;

      reload.remaining -= this.dt;

      if (reload.remaining > 0) continue;

      reload.active = false;
      reload.remaining = 0;

      magazine.ammo = magazine.capacity;
    }
  }
}
