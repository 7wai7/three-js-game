import type InputManager from './input-manager';
import type {
  AxisAction,
  ButtonBinding,
  ButtonState,
  InputAction,
  InputLayerConfig,
} from './types';

export default class InputLayer {
  private readonly input: InputManager;
  readonly config: InputLayerConfig;

  constructor(input: InputManager, config: InputLayerConfig) {
    this.input = input;
    this.config = config;
  }

  pressed(action: InputAction) {
    return this.button(action).pressed;
  }

  clicked(action: InputAction) {
    return this.button(action).clicked;
  }

  released(action: InputAction) {
    return this.button(action).released;
  }

  button(action: InputAction): ButtonState {
    const bindings = this.config.buttons?.[action];

    if (!bindings) {
      return {
        pressed: false,
        clicked: false,
        released: false,
      };
    }

    return {
      pressed: bindings.some((binding) => this.isPressed(binding)),
      clicked: bindings.some((binding) => this.isClicked(binding)),
      released: bindings.some((binding) => this.isReleased(binding)),
    };
  }

  axis(action: AxisAction) {
    const binding = this.config.axes?.[action];
    if (!binding) return 0;

    let value = 0;

    if (binding.negative && this.isPressed(binding.negative)) {
      value -= 1;
    }

    if (binding.positive && this.isPressed(binding.positive)) {
      value += 1;
    }

    return value * (binding.scale ?? 1);
  }

  private isPressed(binding: ButtonBinding) {
    if (binding.device === 'keyboard') {
      return this.input.pressed(binding.code);
    }

    return this.input.isMouseDown(binding.button);
  }

  private isClicked(binding: ButtonBinding) {
    if (binding.device === 'keyboard') {
      return this.input.clicked(binding.code);
    }

    return this.input.isMouseClicked(binding.button);
  }

  private isReleased(binding: ButtonBinding) {
    if (binding.device === 'keyboard') {
      return this.input.released(binding.code);
    }

    return this.input.isMouseReleased(binding.button);
  }
}
