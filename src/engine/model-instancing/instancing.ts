import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { type InstanceNodeMap, type ModelConfig, type SceneRef } from "./config-types";
import { getObjectSize } from "../../utils/get-object-size";
import { getAxisDimensions, getColliderRotationByAxis } from "./utils";
import { COMPONENT_FACTORY, type CreatedComponent, type RuntimeContext } from "./component-factory";
import type Engine from "../engine";

export async function instanceModelByConfig(
    engine: Engine,
    config: ModelConfig,
    nodesByName?: InstanceNodeMap,
) {
    const { world, physicsWorld, scene, assets } = engine;

    if (!nodesByName) nodesByName = new Map();

    const gltf = await assets.gltf.loadModel(config.modelPath);
    const model = gltf.scene;

    fillObjectsMap(config, nodesByName, model);
    fillArmatureObjects(nodesByName, model); 

    const runtimeContext: RuntimeContext = {
        world,
        physicsWorld,
        entitiesByName: new Map<SceneRef, string>(),
        nodesByName,
    };

    createCollidersByConfig(physicsWorld, config, nodesByName);

    createJointsFromConfig(config, runtimeContext)

    const pendingInitializers: CreatedComponent<any>[] = [];

    for (const [nodeName, entityConfig] of Object.entries(config.entities)) {
        const node = nodesByName.get(nodeName);
        if (!node) continue;

        const entity = world.createGameObject(node.source);

        runtimeContext.entitiesByName.set(nodeName, entity);

        for (const componentConfig of entityConfig.components) {
            const created =
                COMPONENT_FACTORY[componentConfig.type]({
                    node,
                    props: componentConfig.props,
                });

            world.addComponent(
                entity,
                created.component,
            );

            if (created.initialize) {
                pendingInitializers.push({
                    component: created.component,
                    initialize: created.initialize,
                });
            }
        }
    }

    for (const item of pendingInitializers) {
        item.initialize?.(
            item.component,
            runtimeContext,
        );
    }

    scene.add(model);

    return {
        entities: runtimeContext.entitiesByName.values(),
        model: model,
        nodesByName
    };
}

function fillObjectsMap(
    config: ModelConfig,
    objectsMap: InstanceNodeMap,
    model: THREE.Object3D
) {
    model.traverse((obj) => {
        for (const [key, entity] of Object.entries(config.entities)) {
            if (key === obj.name && !objectsMap.has(obj.name)) {
                objectsMap.set(obj.name, {
                    source: obj
                })
            }
            if (entity.collider && entity.collider.source === obj.name && !objectsMap.has(obj.name)) {
                objectsMap.set(obj.name, {
                    source: obj
                })
            }
        }

        for (const jointConfig of config.joints) {
            if (jointConfig.type === "revolute" && obj.name === jointConfig.anchor && !objectsMap.has(obj.name)) {
                objectsMap.set(obj.name, {
                    source: obj
                })
            }
        }
    });
}

function fillArmatureObjects(
    objectsMap: InstanceNodeMap,
    model: THREE.Object3D,
) {
    model.traverse((obj) => {
        const isBone =
            obj.type === "Bone" ||
            (obj as THREE.Bone).isBone === true;

        if (!isBone) return;
        if (!obj.name) return;
        if (objectsMap.has(obj.name)) return;

        objectsMap.set(obj.name, {
            source: obj,
        });
    });
}

function createCollidersByConfig(
    physicsWorld: RAPIER.World,
    config: ModelConfig,
    objectsMap: InstanceNodeMap,
) {
    for (const [entityName, entityConfig] of Object.entries(config.entities)) {
        const colliderConfig = entityConfig.collider;
        if (!colliderConfig) continue;

        const target = objectsMap.get(entityName);
        if (!target) {
            console.warn(
                `Target entity not found "${entityName}"`,
            );
            continue;
        }

        const colliderNode = objectsMap.get(
            colliderConfig.source,
        );

        if (!colliderNode) {
            console.warn(
                `Collider source not found "${colliderConfig.source}"`,
            );
            continue;
        }

        colliderNode.source.visible = false;

        const meshWorldPos = new THREE.Vector3();
        const meshWorldQuat = new THREE.Quaternion();

        target.source.getWorldPosition(meshWorldPos);
        target.source.getWorldQuaternion(meshWorldQuat);

        const size = getObjectSize(colliderNode.source);

        let rbDesc: RAPIER.RigidBodyDesc;

        switch (colliderConfig.rigidBodyType) {
            case "FIXED":
                rbDesc = RAPIER.RigidBodyDesc.fixed();
                break;

            case "KINEMATIC":
                rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
                break;

            default:
                rbDesc = RAPIER.RigidBodyDesc.dynamic();
                break;
        }

        rbDesc.setTranslation(
            meshWorldPos.x,
            meshWorldPos.y,
            meshWorldPos.z,
        );

        rbDesc.setRotation({
            x: meshWorldQuat.x,
            y: meshWorldQuat.y,
            z: meshWorldQuat.z,
            w: meshWorldQuat.w,
        });

        const rb = physicsWorld.createRigidBody(rbDesc);

        rb.setLinearDamping(0.1);
        rb.setAngularDamping(0.1);

        if (colliderConfig.enableCcd) {
            rb.enableCcd(true);
        }

        let colliderDesc: RAPIER.ColliderDesc;

        const { length, radius } =
            getAxisDimensions(size, colliderConfig.axis);

        switch (colliderConfig.shape) {
            case "BALL":
                colliderDesc =
                    RAPIER.ColliderDesc.ball(
                        Math.max(
                            size.x,
                            size.y,
                            size.z,
                        ) * 0.5,
                    );
                break;

            case "CAPSULE":
                colliderDesc =
                    RAPIER.ColliderDesc.capsule(
                        Math.max(
                            0,
                            length * 0.5 - radius,
                        ),
                        radius,
                    );
                break;

            case "CYLINDER":
                colliderDesc =
                    RAPIER.ColliderDesc.cylinder(
                        length * 0.5,
                        radius,
                    );
                break;

            default:
                colliderDesc =
                    RAPIER.ColliderDesc.cuboid(
                        size.x * 0.5,
                        size.y * 0.5,
                        size.z * 0.5,
                    );
        }

        target.source.updateMatrixWorld(true);
        colliderNode.source.updateMatrixWorld(true);

        const localPos = new THREE.Vector3();

        const localMatrix =
            target.source.matrixWorld
                .clone()
                .invert()
                .multiply(
                    colliderNode.source.matrixWorld.clone(),
                );

        localMatrix.decompose(
            localPos,
            new THREE.Quaternion(),
            new THREE.Vector3(),
        );

        colliderDesc.setTranslation(
            localPos.x,
            localPos.y,
            localPos.z,
        );

        const localQuat =
            getColliderRotationByAxis(
                colliderConfig.axis,
            );

        colliderDesc.setRotation({
            x: localQuat.x,
            y: localQuat.y,
            z: localQuat.z,
            w: localQuat.w,
        });

        const collider =
            physicsWorld.createCollider(
                colliderDesc,
                rb,
            );


        collider.setRestitution(0);

        if (colliderConfig.mass !== undefined) {
            collider.setMass(colliderConfig.mass);
        }

        if (colliderConfig.friction !== undefined) {
            collider.setFriction(colliderConfig.friction);
        }

        if (colliderConfig.frictionRule !== undefined) {
            collider.setFrictionCombineRule(colliderConfig.frictionRule);
        }

        if (colliderConfig.collisionGroups !== undefined) {
            collider.setCollisionGroups(colliderConfig.collisionGroups);
        }

        target.rigidBody = rb;
        target.collider = collider;
    }
}

function createJointsFromConfig(
    config: ModelConfig,
    ctx: RuntimeContext
) {
    for (const joint of config.joints) {
        const bodyA = ctx.nodesByName.get(joint.bodyA)?.rigidBody;
        const bodyB = ctx.nodesByName.get(joint.bodyB)?.rigidBody;

        if (!bodyA || !bodyB) continue;

        switch (joint.type) {
            case "prismatic": {
                const axis = joint.axis;

                const rapierAxis = {
                    x: axis.x ?? 0,
                    y: axis.y ?? 0,
                    z: axis.z ?? 0,
                };

                const aPos = bodyA.translation();
                const bPos = bodyB.translation();

                const anchor1 = {
                    x: bPos.x - aPos.x,
                    y: bPos.y - aPos.y,
                    z: bPos.z - aPos.z,
                };

                const anchor2 = { x: 0, y: 0, z: 0 };

                const jointData = RAPIER.JointData.prismatic(
                    anchor1,
                    anchor2,
                    rapierAxis,
                );

                const j = ctx.physicsWorld.createImpulseJoint(
                    jointData,
                    bodyA,
                    bodyB,
                    true,
                ) as RAPIER.PrismaticImpulseJoint;

                if (joint.limits) {
                    j.setLimits(joint.limits.min, joint.limits.max);
                }

                if (joint.motorPosition) {
                    j.configureMotorPosition(
                        joint.motorPosition.target,
                        joint.motorPosition.stiffness,
                        joint.motorPosition.damping,
                    );
                }

                break;
            }

            case "revolute": {
                const pivot =
                    ctx.nodesByName.get(joint.anchor);

                if (!pivot) {
                    console.warn("Failed to create 'revolute' joint: anchor object not found");
                    continue;
                }

                const pivotWorld = new THREE.Vector3();

                pivot.source.getWorldPosition(
                    pivotWorld
                );

                const bodyAPos =
                    bodyA.translation();

                const anchor1 = {
                    x: pivotWorld.x - bodyAPos.x,
                    y: pivotWorld.y - bodyAPos.y,
                    z: pivotWorld.z - bodyAPos.z,
                };

                const bodyBPos =
                    bodyB.translation();

                const anchor2 = {
                    x: pivotWorld.x - bodyBPos.x,
                    y: pivotWorld.y - bodyBPos.y,
                    z: pivotWorld.z - bodyBPos.z,
                };

                const axis = {
                    x: joint.axis.x ?? 0,
                    y: joint.axis.y ?? 0,
                    z: joint.axis.z ?? 0,
                };

                const jointData =
                    RAPIER.JointData.revolute(
                        anchor1,
                        anchor2,
                        axis,
                    );

                const j =
                    ctx.physicsWorld.createImpulseJoint(
                        jointData,
                        bodyA,
                        bodyB,
                        true,
                    ) as RAPIER.RevoluteImpulseJoint;

                if (joint.limits) {
                    j.setLimits(joint.limits.min, joint.limits.max);
                }

                if (joint.motorPosition) {
                    j.configureMotorPosition(
                        joint.motorPosition.target,
                        joint.motorPosition.stiffness,
                        joint.motorPosition.damping,
                    );
                }

                break;
            }
        }
    }
}