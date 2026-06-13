import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { type InstanceNodeMap, type ModelConfig, type SceneRef } from "./config-types";
import { getObjectSize } from "../../utils/get-object-size";
import { getAxisDimensions, getColliderRotationByAxis } from "./utils";
import type World from "../ecs/world";
import { COMPONENT_FACTORY, type CreatedComponent, type RuntimeContext } from "./component-factory";

export function instanceModelByConfig(
    world: World,
    physicsWorld: RAPIER.World,
    scene: THREE.Scene,
    config: ModelConfig,
    objectsMap: InstanceNodeMap,
    model: THREE.Object3D
) {
    fillObjectsMap(config, objectsMap, model);

    const runtimeContext: RuntimeContext = {
        world,
        physicsWorld,
        entitiesByName: new Map<SceneRef, number>(),
        nodesByName: objectsMap,
    };

    createCollidersByConfig(physicsWorld, config, objectsMap);

    createJointsFromConfig(config, runtimeContext)

    const pendingInitializers: CreatedComponent<any>[] = [];

    for (const [nodeName, entityConfig] of Object.entries(config.entities)) {
        const node = objectsMap.get(nodeName);
        if (!node) continue;

        const entity = world.createEntity();

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

    return runtimeContext.entitiesByName.values()
}

function fillObjectsMap(
    config: ModelConfig,
    objectsMap: InstanceNodeMap,
    model: THREE.Object3D
) {
    model.traverse((obj) => {
        for (const [key, entity] of Object.entries(config.entities)) {
            if (key === obj.name) {
                objectsMap.set(obj.name, {
                    source: obj
                })
            }
            if (entity.collider && entity.collider.source === obj.name) {
                objectsMap.set(obj.name, {
                    source: obj
                })
            }
        }
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
                        0,
                        joint.motorPosition.stiffness,
                        joint.motorPosition.damping,
                    );
                }

                break;
            }
        }
    }
}