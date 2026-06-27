import RAPIER from "@dimforge/rapier3d";
import {
    GROUP_PLAYER,
    GROUP_VEHICLE,
    GROUP_WHEEL,
    GROUP_WORLD,
    interactionGroups
} from "../../game/physics-groups";
import type { ColliderConfig, EntityConfig, ModelConfig, RevoluteJointConfig } from "../config-types";
import { DEG2RAD } from "three/src/math/MathUtils.js";

const baseComponents = [
    { type: "Object3DComponent" },
    { type: "RigidBodyComponent" },
    { type: "ColliderComponent" },
] as const;

const wheelCollider: Omit<ColliderConfig, "source"> = {
    shape: "BALL" as const,
    axis: "X" as const,
    mass: 300,
    friction: 0,
    frictionRule: RAPIER.CoefficientCombineRule.Min,
    collisionGroups: interactionGroups(
        GROUP_WHEEL,
        GROUP_WORLD | GROUP_PLAYER
    ),
    enableCcd: true,
};

function createWheelRevoluteJoint(
    wheel: string,
    anchor: string,
    isFront = false
) {
    const min = -20 * DEG2RAD;
    const max = 13 * DEG2RAD;

    const revoluteJoint: Omit<RevoluteJointConfig, "bodyB" | "anchor"> = {
        type: "revolute",
        bodyA: "Chassis",
        axis: { x: 1 },
        limits: !isFront
            ? {
                min,
                max,
            }
            : {

                min: max * -1,
                max: min * -1,
            },
        motorPosition: {
            target: !isFront ? min : min * -1,
            stiffness: 500,
            damping: 70,
        }
    };

    return {
        ...revoluteJoint,
        bodyB: wheel,
        anchor
    }
}

function createWheel(
    collider: string,
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
            source: collider,
        },
    };
}

export const axial_XR9_config: ModelConfig = {
    modelPath: "src/assets/Axial-XR9.glb",

    entities: {
        Chassis: {
            components: [
                ...baseComponents,
                {
                    type: "CarComponent",
                    props: {
                        engineForce: 90,
                        brakeForce: 22,
                        sideGrip: 24,
                        pullingForce: 20,
                    },
                },
            ],
            collider: {
                source: "COL_chassis",
                shape: "BOX",
                mass: 300,
                collisionGroups: interactionGroups(
                    GROUP_VEHICLE,
                    GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER
                ),
            },
        },

        wheel_steerFR: createWheel("COL_wheelFR", {
            maxSteerAngleDeg: 30,
        }),

        wheel_steerFL: createWheel("COL_wheelFL", {
            maxSteerAngleDeg: 30,
        }),

        wheel_steerRR: createWheel("COL_wheelRR", {
            isRear: true,
        }),

        wheel_steerRL: createWheel("COL_wheelRL", {
            isRear: true,
        }),
    },

    joints: [
        createWheelRevoluteJoint("wheel_steerFR", "wheel_armFR", true),
        createWheelRevoluteJoint("wheel_steerFL", "wheel_armFL", true),
        createWheelRevoluteJoint("wheel_steerRR", "wheel_armRR"),
        createWheelRevoluteJoint("wheel_steerRL", "wheel_armRL"),
    ],
};