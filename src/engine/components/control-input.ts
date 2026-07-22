import Component from '../ecs/component';
import {
  AXIS_ACTIONS,
  INPUT_ACTIONS,
  type AxisAction,
  type ButtonState,
  type InputAction,
} from '../input/types';

export default class ControlInput extends Component {
  private readonly buttons = new Map<InputAction, ButtonState>();
  private readonly axes = new Map<AxisAction, number>();

  constructor() {
    super();
    this.reset();
  }

  reset() {
    for (const action of INPUT_ACTIONS) {
      this.buttons.set(action, {
        pressed: false,
        clicked: false,
        released: false,
      });
    }

    for (const action of AXIS_ACTIONS) {
      this.axes.set(action, 0);
    }
  }

  setButton(action: InputAction, state: ButtonState) {
    this.buttons.set(action, state);
  }

  setAxis(action: AxisAction, value: number) {
    this.axes.set(action, value);
  }

  pressed(action: InputAction) {
    return this.buttons.get(action)?.pressed ?? false;
  }

  clicked(action: InputAction) {
    return this.buttons.get(action)?.clicked ?? false;
  }

  released(action: InputAction) {
    return this.buttons.get(action)?.released ?? false;
  }

  axis(action: AxisAction) {
    return this.axes.get(action) ?? 0;
  }
}
