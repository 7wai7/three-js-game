import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export const PHYSICS_NAME_PREFIX = {
    PHYSICS: "PH_",
    COLLIDER: "COL_",
    JOINT: "JOINT_",
} as const;

export const USER_DATA_TYPE_OBJECT3D = {
    COLLIDER: "collider",
    JOINT: "joint",
} as const;

export const userDataTypeObject3d = Object.values(
    USER_DATA_TYPE_OBJECT3D,
);

export type UserDataTypeObject3D =
    typeof USER_DATA_TYPE_OBJECT3D[keyof typeof USER_DATA_TYPE_OBJECT3D];

export type ColliderDefUserData = {
    targetName: string;
    shape?: ColliderShape;
    rigidbodyType?: RigidBodyType;
    axis?: Axis;
};

export type JointDefUserData = {
    targetName: string;
    jointType: string;
};

export type PhysicsNodeMap = Map<
    string,
    PhysicsNode
>;

export type PhysicsNode = {
    source: THREE.Object3D;

    colliderDef?: ColliderDefinition;
    jointDef?: JointDefinition;

    rigidBody?: RAPIER.RigidBody;
    collider?: RAPIER.Collider;

    steerPivot?: THREE.Object3D;
}

export type ColliderDefinition = {
    targetName: string;

    shape: ColliderShape;
    rigidbodyType: RigidBodyType;
    axis: Axis;
}

export type JointDefinition = {
    targetName: string;

    jointType: string;
    distance: number;
    direction: THREE.Vector3;
}

export const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
export type ColliderShape = typeof COLLIDER_SHAPE[number];

export const RIGIDBODY_TYPE = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
export type RigidBodyType = typeof RIGIDBODY_TYPE[number];

export const AXIS = ["X", "Y", "Z"];
export type Axis = typeof AXIS[number];
