import Reloadable from '../../components/combat/capabilities/reloadable';
import AutomaticTrigger from '../../components/combat/firing-modes/automatic-trigger';
import FireControl from '../../components/combat/fire-control';
import FireRate from '../../components/combat/fire-rate';
import Magazine from '../../components/combat/magazine';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import System from '../system';

export default class AutomaticFireSystem extends System {
  update(): void {
    for (const [entity, fireControl, fireRate, shotQueue] of this.world.query(
      FireControl,
      FireRate,
      ShotQueue,
      Weapon,
      AutomaticTrigger,
    )) {
      if (!fireControl.canFire) {
        fireRate.clear();
        continue;
      }

      const reloadable = this.world.getComponent(entity, Reloadable);
      if (reloadable?.active) {
        fireRate.clear();
        continue;
      }

      fireRate.tick(this.dt);

      let shots = fireRate.consumeReadyShots();
      if (shots === 0) continue;

      const magazine = this.world.getComponent(entity, Magazine);
      if (magazine) {
        shots = magazine.consumeAvailable(shots);
      }

      if (shots > 0) {
        shotQueue.enqueue(shots);
      }
    }
  }
}
