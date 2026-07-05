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
    { type: "Object3D" },
    { type: "RigidBody" },
    { type: "Collider" },
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
            stiffness: 300,
            damping: 90,
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
                type: "Wheel",
                props: {
                    ...wheelProps,
                    radius: 0.66,
                },
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
                    type: "Car",
                    props: {
                        engineForce: 120,
                        brakeForce: 22,
                        sideGrip: 24,
                        pullingForce: 5,
                    },
                },
            ],
            collider: {
                source: "COL_chassis",
                shape: "BOX",
                mass: 400,
                collisionGroups: interactionGroups(
                    GROUP_VEHICLE,
                    GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER
                ),
            },
        },

        wheel_baseFR: createWheel("COL_wheelFR", {
            maxSteerAngleDeg: 30,
            bones: {
                base: "wheel_baseFR",
                steer: "wheel_steerFR",
                roll: "wheel_rollFR",
            },
        }),

        wheel_baseFL: createWheel("COL_wheelFL", {
            maxSteerAngleDeg: 30,
            bones: {
                base: "wheel_baseFL",
                steer: "wheel_steerFL",
                roll: "wheel_rollFL",
            },
        }),

        wheel_baseRR: createWheel("COL_wheelRR", {
            isRear: true,
            bones: {
                base: "wheel_baseRR",
                steer: "wheel_steerRR",
                roll: "wheel_rollRR",
            },
        }),

        wheel_baseRL: createWheel("COL_wheelRL", {
            isRear: true,
            bones: {
                base: "wheel_baseRL",
                steer: "wheel_steerRL",
                roll: "wheel_rollRL",
            },
        }),
    },

    joints: [
        createWheelRevoluteJoint("wheel_baseFR", "wheel_armFR", true),
        createWheelRevoluteJoint("wheel_baseFL", "wheel_armFL", true),
        createWheelRevoluteJoint("wheel_baseRR", "wheel_armRR"),
        createWheelRevoluteJoint("wheel_baseRL", "wheel_armRL"),
    ],
};