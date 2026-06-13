import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import type { COMPONENT_FACTORY } from "./component-factory";

export type SceneRef = string;

export type ModelConfig = {
    modelPath: string,

    entities: Record<
        SceneRef,
        {
            components: EntityComponentConfig[],
            collider?: ColliderConfig
        }
    >;

    joints: JointConfig[];
}

export type InstanceNode = {
    source: THREE.Object3D;

    rigidBody?: RAPIER.RigidBody;
    collider?: RAPIER.Collider;

    steerPivot?: THREE.Object3D;
}

export type InstanceNodeMap = Map<SceneRef, InstanceNode>;

// COMPONENT TYPES
export type ComponentName =
    keyof typeof COMPONENT_FACTORY;
    
type EntityComponentConfig = {
    type: ComponentName,
    props?: object
}


// COLLIDER TYPES
export type ColliderConfig = {
    source: SceneRef;
    shape?: ColliderShape;
    rigidBodyType?: RigidBodyType;
    axis?: Axis;
    mass?: number
}

// JOINT TYPES
type JointConfig =
    | PrismaticJointConfig
    | RevoluteJointConfig
    | FixedJointConfig
    | SphericalJointConfig;

export type PrismaticJointConfig = {
    type: "prismatic",
    bodyA: SceneRef,
    bodyB: SceneRef,
    axis: JointAxis,
    limits?: {
        min: number,
        max: number,
    },
    motorPosition?: {
        stiffness: number,
        damping: number,
    }
}

export type RevoluteJointConfig = {
    type: "revolute-suspension",
}

export type FixedJointConfig = {
    type: "fixed",
}

export type SphericalJointConfig = {
    type: "spherical",
}

export const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
export type ColliderShape = typeof COLLIDER_SHAPE[number];

export const RIGIDBODY_TYPE = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
export type RigidBodyType = typeof RIGIDBODY_TYPE[number];

export const AXIS = ["X", "Y", "Z"] as const;
export type Axis = typeof AXIS[number];

type JointAxis = {
    x?: -1 | 0 | 1,
    y?: -1 | 0 | 1,
    z?: -1 | 0 | 1,
}