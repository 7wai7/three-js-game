import ControlInput from '../../components/control-input';
import FireControl from '../../components/combat/fire-control';
import FireInput from '../../components/combat/fire-input';
import Weapon from '../../components/combat/weapon';
import type { EntityId } from '../../ecs/types';
import System from '../system';

export default class FireInputSystem extends System {
  update(): void {
    for (const [entity, fireControl] of this.world.query(FireControl)) {
      fireControl.resetFrame();

      const fireInput = this.world.getComponent(entity, FireInput);
      if (!fireInput || !this.world.getComponent(entity, Weapon)) continue;

      const input = this.getControlInput(entity);
      fireControl.setActive(input?.pressed(fireInput.action) ?? false);
    }
  }

  private getControlInput(entity: EntityId) {
    return (
      this.world.getComponent(entity, ControlInput) ??
      this.world.getParentComponent(entity, ControlInput)
    );
  }
}
