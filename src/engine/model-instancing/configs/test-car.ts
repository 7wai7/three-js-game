import RAPIER from "@dimforge/rapier3d";
import {
    GROUP_PLAYER,
    GROUP_VEHICLE,
    GROUP_WHEEL,
    GROUP_WORLD,
    interactionGroups
} from "../../game/physics-groups";
import type { ColliderConfig, EntityConfig, ModelConfig, PrismaticJointConfig } from "../config-types";

const baseComponents = [
    { type: "Object3DComponent" },
    { type: "RigidBodyComponent" },
    { type: "ColliderComponent" },
] as const;

const wheelCollider: Omit<ColliderConfig, "source"> = {
    shape: "BALL" as const,
    axis: "X" as const,
    mass: 100,
    friction: 0,
    frictionRule: RAPIER.CoefficientCombineRule.Min,
    collisionGroups: interactionGroups(
        GROUP_WHEEL,
        GROUP_WORLD | GROUP_PLAYER
    ),
    enableCcd: true,
};

const prismaticJoint: Omit<PrismaticJointConfig, "bodyB"> = {
    type: "prismatic",
    bodyA: "chassis",
    axis: { y: 1 },
    limits: {
        min: 0,
        max: 0.15,
    },
    motorPosition: {
        stiffness: 500,
        damping: 70,
    }
};

function createWheel(
    source: string,
    wheelProps?: Record<string, unknown>
): EntityConfig {
    return {
        components: [
            ...baseComponents,
            {
                type: "WheelComponent",
                props: wheelProps,
            },
        ],
        collider: {
            ...wheelCollider,
            source,
        },
    };
}

export const testCarConfig: ModelConfig = {
    modelPath: "src/assets/car.glb",

    entities: {
        chassis: {
            components: [
                ...baseComponents,
                {
                    type: "CarComponent",
                    props: {
                        engineForce: 70,
                        brakeForce: 12,
                        sideGrip: 12,
                        pullingForce: 20,
                    },
                },
            ],
            collider: {
                source: "COL_chassis",
                shape: "BOX",
                mass: 700,
                collisionGroups: interactionGroups(
                    GROUP_VEHICLE,
                    GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER
                ),
            },
        },

        wheel_FR: createWheel("COL_FR", {
            maxSteerAngleDeg: 30,
        }),

        wheel_FL: createWheel("COL_FL", {
            maxSteerAngleDeg: 30,
        }),

        wheel_RR: createWheel("COL_RR", {
            isRear: true,
        }),

        wheel_RL: createWheel("COL_RL", {
            isRear: true,
        }),
    },

    joints: [
        { ...prismaticJoint, bodyB: "wheel_FR" },
        { ...prismaticJoint, bodyB: "wheel_FL" },
        { ...prismaticJoint, bodyB: "wheel_RR" },
        { ...prismaticJoint, bodyB: "wheel_RL" },
    ],
};