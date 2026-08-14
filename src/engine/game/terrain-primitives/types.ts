import * as THREE from 'three';
import type { SpawnTransform } from '../../../utils/spawn-transform';
import {
  interactionGroups,
  GROUP_WORLD,
  GROUP_PLAYER,
  GROUP_WHEEL,
  GROUP_VEHICLE,
} from '../physics-groups';

export const DEFAULT_PRIMITIVE_COLLISION_GROUPS = interactionGroups(
  GROUP_WORLD,
  GROUP_WORLD | GROUP_PLAYER | GROUP_WHEEL | GROUP_VEHICLE,
);

export type PrimitiveRigidBodyType = 'fixed' | 'dynamic' | 'kinematic';

export type PrimitiveOptions = SpawnTransform & {
  rigidBodyType?: PrimitiveRigidBodyType;
  color?: THREE.ColorRepresentation;
  material?: THREE.Material | THREE.Material[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  collisionGroups?: number;
  restitution?: number;
  friction?: number;
  density?: number;
  mass?: number;
  linearDamping?: number;
  angularDamping?: number;
  enableCcd?: boolean;
  name?: string;
};

export type CubeOptions = PrimitiveOptions & {
  size?: number;
  width?: number;
  height?: number;
  depth?: number;
};

export type SphereOptions = PrimitiveOptions & {
  size?: number;
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
};

export type CylinderOptions = PrimitiveOptions & {
  size?: number;
  radius?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
};
