import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import type Engine from '../../engine';
import type { CylinderOptions } from './types';
import { positive, createPrimitiveMaterial, createPrimitiveEntity } from './utils';

export function createCylinder(engine: Engine, options: CylinderOptions = {}) {
  const size = options.size ?? 1;
  const radius = positive(options.radius ?? size / 2, 'Cylinder radius');
  const height = positive(options.height ?? size, 'Cylinder height');

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      options.radialSegments ?? 32,
      options.heightSegments ?? 1,
      options.openEnded ?? false,
    ),
    createPrimitiveMaterial(options, 0xffaa33),
  );

  const colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius);

  return createPrimitiveEntity(engine, mesh, colliderDesc, options);
}
