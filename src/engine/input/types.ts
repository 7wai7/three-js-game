export type InputKey =
  | 'KeyW'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'KeyQ'
  | 'KeyE'
  | 'KeyC'
  | 'KeyR'
  | 'Space'
  | 'ShiftLeft'
  | 'ShiftRight'
  | 'Tab'
  | 'AltLeft'
  | 'Escape';

export type MouseButton = 0 | 1 | 2; // left, middle, right

export const INPUT_ACTIONS = [
  'firePrimary',
  'fireSecondary',
  'reload',
  'jump',
  'crouch',
  'sprint',
  'brake',
  'boost',
  'cameraRotate',
  'showColliders',
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];

export const AXIS_ACTIONS = ['moveX', 'moveY', 'lookX', 'lookY', 'zoom'] as const;

export type AxisAction = (typeof AXIS_ACTIONS)[number];

export type ButtonBinding =
  { device: 'keyboard'; code: InputKey } | { device: 'mouse'; button: MouseButton };

export type AxisBinding =
  | {
      type: 'buttons';
      negative?: ButtonBinding;
      positive?: ButtonBinding;
      scale?: number;
    }
  | {
      type: 'mouse';
      axis: 'x' | 'y';
      scale?: number;
    }
  | {
      type: 'wheel';
      scale?: number;
    };

export type InputLayerConfig = {
  buttons?: Partial<Record<InputAction, ButtonBinding[]>>;
  axes?: Partial<Record<AxisAction, AxisBinding>>;
};

export type ButtonState = {
  pressed: boolean;
  clicked: boolean;
  released: boolean;
};
