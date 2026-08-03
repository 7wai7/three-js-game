import ControlInput from '../../components/control-input';
import FireControl from '../../components/combat/fire-control';
import Weapon from '../../components/combat/weapon';
import type { EntityId } from '../../ecs/types';
import System from '../system';

export default class FireInputSystem extends System {
  update(): void {
    for (const [entity, fireControl] of this.world.query(FireControl)) {
      fireControl.resetFrame();

      if (!this.world.getComponent(entity, Weapon)) continue;

      const input = this.getControlInput(entity);
      this.setActiveFromInput(fireControl, input);
    }
  }

  private setActiveFromInput(fireControl: FireControl, controlInput?: ControlInput) {
    fireControl.setActive(this.readInputState(fireControl, controlInput));
  }

  private readInputState(fireControl: FireControl, controlInput?: ControlInput) {
    if (!controlInput) {
      return false;
    }

    switch (fireControl.mode) {
      case 'clicked':
        return controlInput.clicked(fireControl.action);
      case 'released':
        return controlInput.released(fireControl.action);
      case 'pressed':
      default:
        return controlInput.pressed(fireControl.action);
    }
  }

  private getControlInput(entity: EntityId) {
    return (
      this.world.getComponent(entity, ControlInput) ??
      this.world.getParentComponent(entity, ControlInput)
    );
  }
}
