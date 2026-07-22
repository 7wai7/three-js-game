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
    return this.buttonValue(action, 'pressed');
  }

  clicked(action: InputAction) {
    return this.buttonValue(action, 'clicked');
  }

  released(action: InputAction) {
    return this.buttonValue(action, 'released');
  }

  button(action: InputAction, out: ButtonState): ButtonState {
    const bindings = this.config.buttons?.[action];

    out.pressed = false;
    out.clicked = false;
    out.released = false;

    if (!bindings) return out;

    for (const binding of bindings) {
      out.pressed ||= this.isPressed(binding);
      out.clicked ||= this.isClicked(binding);
      out.released ||= this.isReleased(binding);
    }

    return out;
  }

  axis(action: AxisAction) {
    const binding = this.config.axes?.[action];
    if (!binding) return 0;

    switch (binding.type) {
      case 'mouse':
        return (
          (binding.axis === 'x' ? this.input.mouseDelta.x : this.input.mouseDelta.y) *
          (binding.scale ?? 1)
        );

      case 'wheel':
        return this.input.wheelDelta * (binding.scale ?? 1);

      case 'buttons': {
        let value = 0;

        if (binding.negative && this.isPressed(binding.negative)) {
          value -= 1;
        }

        if (binding.positive && this.isPressed(binding.positive)) {
          value += 1;
        }

        return value * (binding.scale ?? 1);
      }
    }
  }

  private buttonValue(action: InputAction, key: keyof ButtonState) {
    const bindings = this.config.buttons?.[action];
    if (!bindings) return false;

    for (const binding of bindings) {
      if (key === 'pressed' && this.isPressed(binding)) return true;
      if (key === 'clicked' && this.isClicked(binding)) return true;
      if (key === 'released' && this.isReleased(binding)) return true;
    }

    return false;
  }

  private isPressed(binding: ButtonBinding) {
    return binding.device === 'keyboard'
      ? this.input.pressed(binding.code)
      : this.input.isMouseDown(binding.button);
  }

  private isClicked(binding: ButtonBinding) {
    return binding.device === 'keyboard'
      ? this.input.clicked(binding.code)
      : this.input.isMouseClicked(binding.button);
  }

  private isReleased(binding: ButtonBinding) {
    return binding.device === 'keyboard'
      ? this.input.released(binding.code)
      : this.input.isMouseReleased(binding.button);
  }
}
