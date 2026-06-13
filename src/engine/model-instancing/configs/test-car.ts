import type { ModelConfig } from "../config-types";

export const testCarConfig: ModelConfig = {
    modelPath: "src/assets/cer.glb",

    entities: {
        chassis: {
            components: [
                {
                    type: "Object3DComponent"
                },
                {
                    type: "RigidBodyComponent"
                },
                {
                    type: "ColliderComponent"
                },
                {
                    type: "CarComponent",
                    props: {
                        engineForce: 70,
                        brakeForce: 12,
                        sideGrip: 17,
                        pullingForce: 20,
                    }
                }
            ],
            collider: {
                source: "COL_chassis",
                shape: "BOX",
                mass: 700,
            },
        },

        wheel_FR: {
            components: [
                {
                    type: "Object3DComponent"
                },
                {
                    type: "RigidBodyComponent"
                },
                {
                    type: "ColliderComponent"
                },
                {
                    type: "WheelComponent",
                    props: {
                        maxSteerAngle: 30,
                    }
                }
            ],
            collider: {
                shape: "BALL",
                source: "COL_FR",
                axis: 'X',
                mass: 100,
            }
        },
        wheel_FL: {
            components: [
                {
                    type: "Object3DComponent"
                },
                {
                    type: "RigidBodyComponent"
                },
                {
                    type: "ColliderComponent"
                },
                {
                    type: "WheelComponent",
                    props: {
                        maxSteerAngle: 30,
                    }
                }
            ],
            collider: {
                shape: "BALL",
                source: "COL_FL",
                axis: 'X',
                mass: 100,
            }
        },
        wheel_RR: {
            components: [
                {
                    type: "Object3DComponent"
                },
                {
                    type: "RigidBodyComponent"
                },
                {
                    type: "ColliderComponent"
                },
                {
                    type: "WheelComponent",
                    props: {
                        isRear: true
                    }
                }
            ],
            collider: {
                shape: "BALL",
                source: "COL_RR",
                axis: 'X',
                mass: 100,
            }
        },
        wheel_RL: {
            components: [
                {
                    type: "Object3DComponent"
                },
                {
                    type: "RigidBodyComponent"
                },
                {
                    type: "ColliderComponent"
                },
                {
                    type: "WheelComponent",
                    props: {
                        isRear: true
                    }
                }
            ],
            collider: {
                shape: "BALL",
                source: "COL_RL",
                axis: 'X',
                mass: 100,
            }
        },
    },

    joints: [
        {
            type: "prismatic",
            bodyA: "chassis",
            bodyB: "wheel_FR",
            axis: {
                y: 1
            },
            limits: {
                min: 0,
                max: 0.15,
            },
            motorPosition: {
                stiffness: 500,
                damping: 70,
            }
        },
        {
            type: "prismatic",
            bodyA: "chassis",
            bodyB: "wheel_FL",
            axis: {
                y: 1
            },
            limits: {
                min: 0,
                max: 0.15,
            },
            motorPosition: {
                stiffness: 500,
                damping: 70,
            }
        },
        {
            type: "prismatic",
            bodyA: "chassis",
            bodyB: "wheel_RR",
            axis: {
                y: 1
            },
            limits: {
                min: 0,
                max: 0.15,
            },
            motorPosition: {
                stiffness: 500,
                damping: 70,
            }
        },
        {
            type: "prismatic",
            bodyA: "chassis",
            bodyB: "wheel_RL",
            axis: {
                y: 1
            },
            limits: {
                min: 0,
                max: 0.15,
            },
            motorPosition: {
                stiffness: 500,
                damping: 70,
            }
        },
    ]
}
