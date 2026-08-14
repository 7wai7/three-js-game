import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import type Engine from '../../engine';
import type { CubeOptions } from './types';
import { positive, createPrimitiveMaterial, createPrimitiveEntity } from './utils';

export function createCube(engine: Engine, options: CubeOptions = {}) {
  const size = options.size ?? 1;
  const width = positive(options.width ?? size, 'Cube width');
  const height = positive(options.height ?? size, 'Cube height');
  const depth = positive(options.depth ?? size, 'Cube depth');

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    createPrimitiveMaterial(options, 0x66cc00),
  );

  const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);

  return createPrimitiveEntity(engine, mesh, colliderDesc, options);
}

export function createBox(engine: Engine, options: CubeOptions = {}) {
  return createCube(engine, options);
}
