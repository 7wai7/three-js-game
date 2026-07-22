import Component from '../ecs/component';
import {
  INPUT_ACTIONS,
  AXIS_ACTIONS,
  type AxisAction,
  type ButtonState,
  type InputAction,
} from '../input/types';

const EMPTY_BUTTON: ButtonState = {
  pressed: false,
  clicked: false,
  released: false,
};

export default class ControlInput extends Component {
  readonly buttons: Record<InputAction, ButtonState>;
  readonly axes: Record<AxisAction, number>;

  constructor() {
    super();

    this.buttons = Object.fromEntries(
      INPUT_ACTIONS.map((action) => [action, { ...EMPTY_BUTTON }]),
    ) as Record<InputAction, ButtonState>;

    this.axes = Object.fromEntries(AXIS_ACTIONS.map((action) => [action, 0])) as Record<
      AxisAction,
      number
    >;
  }

  reset() {
    for (const action of INPUT_ACTIONS) {
      const state = this.buttons[action];
      state.pressed = false;
      state.clicked = false;
      state.released = false;
    }

    for (const action of AXIS_ACTIONS) {
      this.axes[action] = 0;
    }
  }

  setButton(action: InputAction, state: ButtonState) {
    const target = this.buttons[action];

    target.pressed = state.pressed;
    target.clicked = state.clicked;
    target.released = state.released;
  }

  setAxis(action: AxisAction, value: number) {
    this.axes[action] = value;
  }

  pressed(action: InputAction) {
    return this.buttons[action].pressed;
  }

  clicked(action: InputAction) {
    return this.buttons[action].clicked;
  }

  released(action: InputAction) {
    return this.buttons[action].released;
  }

  axis(action: AxisAction) {
    return this.axes[action];
  }
}
