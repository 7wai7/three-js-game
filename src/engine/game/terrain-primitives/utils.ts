import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import { resolveSpawnTransform } from '../../../utils/spawn-transform';
import Colliders from '../../components/colliders';
import type Engine from '../../engine';
import {
  type PrimitiveOptions,
  DEFAULT_PRIMITIVE_COLLISION_GROUPS,
  type PrimitiveRigidBodyType,
} from './types';
import RigidBody from '../../components/rigidbody';

export function createPrimitiveEntity(
  engine: Engine,
  mesh: THREE.Mesh,
  colliderDesc: RAPIER.ColliderDesc,
  options: PrimitiveOptions,
) {
  const { world, physicsWorld, scene } = engine;
  const { position, rotation } = resolveSpawnTransform(options);

  if (options.name) {
    mesh.name = options.name;
  }

  mesh.position.copy(position);
  mesh.quaternion.copy(rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;

  scene.add(mesh);

  const rbDesc = createRigidBodyDesc(options.rigidBodyType ?? 'dynamic')
    .setTranslation(position.x, position.y, position.z)
    .setRotation(rotation)
    .setLinearDamping(options.linearDamping ?? 0.1)
    .setAngularDamping(options.angularDamping ?? 0.1);

  colliderDesc
    .setCollisionGroups(options.collisionGroups ?? DEFAULT_PRIMITIVE_COLLISION_GROUPS)
    .setRestitution(options.restitution ?? 0.3);

  if (options.friction !== undefined) {
    colliderDesc.setFriction(options.friction);
  }

  if (options.density !== undefined) {
    colliderDesc.setDensity(options.density);
  }

  if (options.mass !== undefined) {
    colliderDesc.setMass(options.mass);
  }

  const rb = physicsWorld.createRigidBody(rbDesc);

  if (options.enableCcd) {
    rb.enableCcd(true);
  }

  const collider = physicsWorld.createCollider(colliderDesc, rb);

  const entity = world.createGameObject(mesh);
  world.addComponent(entity, new RigidBody(rb));
  world.addComponent(entity, new Colliders([collider]));

  return entity;
}

export function createPrimitiveMaterial(
  options: PrimitiveOptions,
  defaultColor: THREE.ColorRepresentation,
) {
  return (
    options.material ?? new THREE.MeshStandardMaterial({ color: options.color ?? defaultColor })
  );
}

export function createRigidBodyDesc(type: PrimitiveRigidBodyType) {
  switch (type) {
    case 'fixed':
      return RAPIER.RigidBodyDesc.fixed();

    case 'kinematic':
      return RAPIER.RigidBodyDesc.kinematicPositionBased();

    case 'dynamic':
      return RAPIER.RigidBodyDesc.dynamic();
  }
}

export function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }

  return value;
}
