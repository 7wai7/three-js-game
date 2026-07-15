import RAPIER from "@dimforge/rapier3d";
import {
    GROUP_PLAYER,
    GROUP_VEHICLE,
    GROUP_WHEEL,
    GROUP_WORLD,
    interactionGroups
} from "../../game/physics-groups";
import Car from "../../components/vehicle/car";
import Wheel from "../../components/vehicle/wheel";
import { component, type ColliderConfig, type ComponentProps, type EntityConfig, type ModelConfig, type PrismaticJointConfig, type RevoluteJointConfig } from "../config-types";

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
    bodyA: "PH_chassis",
    axis: { y: 1 },
    limits: {
        min: -0.10,
        max: 0.15,
    },
    motorPosition: {
        target: -0.05,
        stiffness: 500,
        damping: 70,
    }
};

const revoluteJoint: Omit<RevoluteJointConfig, "bodyB" | "anchor"> = {
    type: "revolute",
    bodyA: "PH_chassis",
    axis: { x: 1 },
    limits: {
        min: -0.10,
        max: 0.35,
    },
    motorPosition: {
        target: -0.05,
        stiffness: 2000,
        damping: 170,
    }
};

function createWheel(
    source: string,
    wheelProps?: ComponentProps<typeof Wheel>
): EntityConfig {
    return {
        components: [
            component(Wheel, wheelProps),
        ],
        collider: {
            ...wheelCollider,
            source,
        },
    };
}

export const testCarConfig: ModelConfig = {
    modelPath: "src/assets/test-car.glb",

    entities: {
        PH_chassis: {
            components: [
                component(
                    Car,
                    {
                        engineForce: 70,
                        brakeForce: 12,
                        sideGrip: 12,
                        pullingForce: 20,
                    },
                ),
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

        PH_wheel_FR: createWheel("COL_FR", {
            maxSteerAngleDeg: 30,
        }),

        PH_wheel_FL: createWheel("COL_FL", {
            maxSteerAngleDeg: 30,
        }),

        PH_wheel_RR: createWheel("COL_RR", {
            isRear: true,
        }),

        PH_wheel_RL: createWheel("COL_RL", {
            isRear: true,
        }),
    },

    joints: [
        { ...prismaticJoint, bodyB: "PH_wheel_FR" },
        { ...prismaticJoint, bodyB: "PH_wheel_FL" },
        { ...revoluteJoint, bodyB: "PH_wheel_RR", anchor: "JOINT_RR" },
        { ...revoluteJoint, bodyB: "PH_wheel_RL", anchor: "JOINT_RL" },
    ],
};
