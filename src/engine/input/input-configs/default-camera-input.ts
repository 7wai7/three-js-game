import type { InputLayerConfig } from '../types';

export const defaultCameraInput: InputLayerConfig = {
  buttons: {
    cameraRotate: [{ device: 'mouse', button: 0 }],
  },

  axes: {
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
    zoom: {
      type: 'wheel',
      scale: 1,
    },
  },
};
