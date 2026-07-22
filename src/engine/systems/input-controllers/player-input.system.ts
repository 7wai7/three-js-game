import ControlInput from '../../components/control-input';
import PlayerControlled from '../../components/player-controlled';
import { AXIS_ACTIONS, INPUT_ACTIONS } from '../../input/types';
import System from '../system';

export default class PlayerInputSystem extends System {
  update(): void {
    const entities = this.world.entitiesWith(PlayerControlled);

    for (const entity of entities) {
      const player = this.world.getComponent(entity, PlayerControlled)!;
      const layer = this.engine.getInputLayer(player.inputLayer);

      if (!layer) continue;

      let controlInput = this.world.getComponent(entity, ControlInput);

      if (!controlInput) {
        controlInput = this.world.addComponent(entity, new ControlInput());
      }

      controlInput.reset();

      for (const action of INPUT_ACTIONS) {
        controlInput.setButton(action, layer.button(action));
      }

      for (const action of AXIS_ACTIONS) {
        controlInput.setAxis(action, layer.axis(action));
      }
    }
  }
}
