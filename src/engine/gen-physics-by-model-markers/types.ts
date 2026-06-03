import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export type CreatedPhysicsObject = {
    mesh: any;
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}

export type ColliderDefinition = {
    mesh: THREE.Object3D;
    colliderMarker: THREE.Object3D;
    shape: ColliderShape,
    rigidBodyDesc: RigidBodyDesc,
    axis: Axis
};

export const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
export type ColliderShape = typeof COLLIDER_SHAPE[number];

export const RIGIDBODY_DESC = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
export type RigidBodyDesc = typeof RIGIDBODY_DESC[number];

export const AXIS = ["X", "Y", "Z"];
export type Axis = typeof AXIS[number];
