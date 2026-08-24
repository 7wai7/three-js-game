import * as THREE from 'three';
import type { ModelConfig } from '../config-types';

export const playerConfig: ModelConfig = {
  modelPath: 'src/assets/Player/Mesh.glb',

  entities: {
    Armature: {
      colliders: [
        {
          shape: 'CAPSULE',
          halfHeight: 0.9,
          radius: 0.22,
          position: { y: 10.45 },
          rotation: new THREE.Euler(0, 0, Math.PI),
          axis: 'Z',
        },
      ],
    },
  },
};
