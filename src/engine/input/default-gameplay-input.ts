import type { InputLayerConfig } from './types';

export const defaultGameplayInput: InputLayerConfig = {
  axes: {
    moveX: {
      negative: { device: 'keyboard', code: 'KeyA' },
      positive: { device: 'keyboard', code: 'KeyD' },
    },
    moveY: {
      negative: { device: 'keyboard', code: 'KeyS' },
      positive: { device: 'keyboard', code: 'KeyW' },
    },
  },

  buttons: {
    firePrimary: [{ device: 'mouse', button: 0 }],
    fireSecondary: [{ device: 'mouse', button: 2 }],
    reload: [{ device: 'keyboard', code: 'KeyR' }],
    jump: [{ device: 'keyboard', code: 'Space' }],
    crouch: [{ device: 'keyboard', code: 'KeyC' }],
    sprint: [
      { device: 'keyboard', code: 'ShiftLeft' },
      { device: 'keyboard', code: 'ShiftRight' },
    ],
    brake: [{ device: 'keyboard', code: 'Space' }],
    boost: [
      { device: 'keyboard', code: 'ShiftLeft' },
      { device: 'keyboard', code: 'ShiftRight' },
    ],
  },
};
