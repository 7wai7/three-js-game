import * as THREE from 'three';

export type SpawnTransform = {
  position?: THREE.Vector3;
  rotation?: THREE.Quaternion | THREE.Euler;
};

export function resolveSpawnTransform(options?: SpawnTransform) {
  return {
    position: options?.position ?? new THREE.Vector3(0, 1, 0),

    rotation:
      options?.rotation instanceof THREE.Euler
        ? new THREE.Quaternion().setFromEuler(options.rotation)
        : (options?.rotation ?? new THREE.Quaternion()),
  };
}
