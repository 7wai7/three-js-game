import Chargeable from '../../components/combat/capabilities/chargeable';
import FireControl from '../../components/combat/fire-control';
import Weapon from '../../components/combat/weapon';
import System from '../system';

export default class ChargingSystem extends System {
  update(): void {
    for (const [, charge, fireControl] of this.world.query(Chargeable, FireControl, Weapon)) {
      if (fireControl.started) {
        charge.active = true;
        charge.elapsed = 0;
      }

      if (charge.active && fireControl.active) {
        charge.elapsed = Math.min(charge.elapsed + this.dt, charge.duration);
      }

      if (fireControl.stopped) {
        charge.active = false;
      }

      if (fireControl.active && charge.active && charge.charge01 < 1) {
        fireControl.block();
      }
    }
  }
}
