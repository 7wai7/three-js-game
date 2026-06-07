import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export type PhysicsObject = {
    mesh: THREE.Object3D;
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}

export type VehiclePhysicsObject = PhysicsObject & {
    steerPivot: THREE.Object3D;
}

// description of the object found at the scene
export type ColliderDefinition = {
    mesh: THREE.Object3D;
    colliderMarker: THREE.Object3D;

    shape: ColliderShape,
    rigidbodyType: RigidBodyType,
    axis: Axis
};

export const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
export type ColliderShape = typeof COLLIDER_SHAPE[number];

export const RIGIDBODY_TYPE = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
export type RigidBodyType = typeof RIGIDBODY_TYPE[number];

export const AXIS = ["X", "Y", "Z"];
export type Axis = typeof AXIS[number];
