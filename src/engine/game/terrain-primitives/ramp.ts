import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import type Engine from '../../engine';
import type { RampOptions } from './types';
import { positive, createPrimitiveMaterial, createPrimitiveEntity } from './utils';

type RampGeometryData = {
  vertices: Float32Array;
  indices: Uint32Array;
};

export function createRamp(engine: Engine, options: RampOptions = {}) {
  const width = positive(options.width ?? 4, 'Ramp width');
  const length = positive(options.length ?? 8, 'Ramp length');
  const height = positive(options.height ?? 2, 'Ramp height');
  const thickness = positive(options.thickness ?? 0.2, 'Ramp thickness');
  const bend = finite(options.bend ?? 0, 'Ramp bend');
  const segments = positiveInteger(options.segments ?? 16, 'Ramp segments');

  const geometryData = createRampGeometryData({
    width,
    length,
    height,
    thickness,
    bend,
    segments,
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(geometryData.vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(geometryData.indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, createPrimitiveMaterial(options, 0x999999));
  const colliderDesc = RAPIER.ColliderDesc.trimesh(geometryData.vertices, geometryData.indices);

  return createPrimitiveEntity(engine, mesh, colliderDesc, {
    ...options,
    rigidBodyType: options.rigidBodyType ?? 'fixed',
  });
}

function createRampGeometryData({
  width,
  length,
  height,
  thickness,
  bend,
  segments,
}: {
  width: number;
  length: number;
  height: number;
  thickness: number;
  bend: number;
  segments: number;
}): RampGeometryData {
  const vertices: number[] = [];
  const indices: number[] = [];
  const halfWidth = width / 2;
  const halfLength = length / 2;
  const bottomY = -thickness;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const z = -halfLength + t * length;
    const y = getRampHeight(t, height, bend);

    vertices.push(-halfWidth, y, z);
    vertices.push(halfWidth, y, z);
    vertices.push(-halfWidth, bottomY, z);
    vertices.push(halfWidth, bottomY, z);
  }

  for (let i = 0; i < segments; i += 1) {
    const current = i * 4;
    const next = (i + 1) * 4;

    const topLeft = current;
    const topRight = current + 1;
    const bottomLeft = current + 2;
    const bottomRight = current + 3;

    const nextTopLeft = next;
    const nextTopRight = next + 1;
    const nextBottomLeft = next + 2;
    const nextBottomRight = next + 3;

    indices.push(topLeft, nextTopLeft, topRight, topRight, nextTopLeft, nextTopRight);
    indices.push(
      bottomLeft,
      bottomRight,
      nextBottomLeft,
      bottomRight,
      nextBottomRight,
      nextBottomLeft,
    );
    indices.push(topLeft, bottomLeft, nextTopLeft, bottomLeft, nextBottomLeft, nextTopLeft);
    indices.push(topRight, nextTopRight, bottomRight, nextTopRight, nextBottomRight, bottomRight);
  }

  const start = 0;
  const end = segments * 4;

  indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  indices.push(end, end + 1, end + 2, end + 1, end + 3, end + 2);

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

function getRampHeight(t: number, height: number, bend: number) {
  return height * (t + bend * t * (1 - t));
}

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return value;
}
