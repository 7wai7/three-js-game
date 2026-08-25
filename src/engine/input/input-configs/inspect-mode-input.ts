import type { InputLayerConfig } from '../types';

export const inspectModeInput: InputLayerConfig = {
  buttons: {
    boost: [
      { device: 'keyboard', code: 'ShiftLeft' },
      { device: 'keyboard', code: 'ShiftRight' },
    ],
    toggleInspectMode: [{ device: 'keyboard', code: 'Backquote' }],
  },

  axes: {
    moveX: {
      type: 'buttons',
      negative: { device: 'keyboard', code: 'KeyA' },
      positive: { device: 'keyboard', code: 'KeyD' },
    },
    moveY: {
      type: 'buttons',
      negative: { device: 'keyboard', code: 'KeyS' },
      positive: { device: 'keyboard', code: 'KeyW' },
    },
    lookX: {
      type: 'mouse',
      axis: 'x',
      scale: 1,
    },
    lookY: {
      type: 'mouse',
      axis: 'y',
      scale: 1,
    },
  },
};
