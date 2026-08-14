import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import type Engine from '../../engine';
import type { SphereOptions } from './types';
import { positive, createPrimitiveMaterial, createPrimitiveEntity } from './utils';

export function createSphere(engine: Engine, options: SphereOptions = {}) {
  const radius = positive(options.radius ?? (options.size ?? 1) / 2, 'Sphere radius');

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, options.widthSegments ?? 32, options.heightSegments ?? 16),
    createPrimitiveMaterial(options, 0x3388ff),
  );

  const colliderDesc = RAPIER.ColliderDesc.ball(radius);

  return createPrimitiveEntity(engine, mesh, colliderDesc, options);
}
