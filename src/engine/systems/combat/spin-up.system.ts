import SpinUp from '../../components/combat/capabilities/spin-up';
import FireControl from '../../components/combat/fire-control';
import Weapon from '../../components/combat/weapon';
import System from '../system';

export default class SpinUpSystem extends System {
  update(): void {
    for (const [, spinUp, fireControl] of this.world.query(SpinUp, FireControl, Weapon)) {
      const target = fireControl.active ? 1 : 0;
      const duration = target > spinUp.value ? spinUp.spinUpTime : spinUp.spinDownTime;
      const speed = duration > 0 ? 1 / duration : Number.POSITIVE_INFINITY;
      const direction = Math.sign(target - spinUp.value);

      if (direction !== 0) {
        spinUp.value += direction * speed * this.dt;
        spinUp.value = Math.max(0, Math.min(spinUp.value, 1));
      }

      if (fireControl.active && !spinUp.ready) {
        fireControl.block();
      }
    }
  }
}
