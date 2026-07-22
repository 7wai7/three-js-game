import ControlInput from '../../components/control-input';
import PlayerControlled from '../../components/player-controlled';
import { AXIS_ACTIONS, INPUT_ACTIONS } from '../../input/types';
import System from '../system';

export default class PlayerInputSystem extends System {
  update(): void {
    for (const [entity, player] of this.world.query(PlayerControlled)) {
      const layer = this.engine.getInputLayer(player.inputLayer);
      if (!layer) continue;

      let input = this.world.getComponent(entity, ControlInput);

      if (!input) {
        input = this.world.addComponent(entity, new ControlInput());
      }

      input.reset();

      for (const action of INPUT_ACTIONS) {
        layer.button(action, input.buttons[action]);
      }

      for (const action of AXIS_ACTIONS) {
        input.axes[action] = layer.axis(action);
      }
    }
  }
}
