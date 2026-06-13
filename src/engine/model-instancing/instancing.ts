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

    createCollidersByConfig(physicsWorld, config, objectsMap);

    const pendingInitializers: CreatedComponent<any>[] = [];

    const entitiesByName = new Map<SceneRef, number>();

    for (const [nodeName, entityConfig] of Object.entries(config.entities)) {
        const node = objectsMap.get(nodeName);
        if (!node) continue;

        const entity = world.createEntity();

        entitiesByName.set(nodeName, entity);

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

    const runtimeContext: RuntimeContext = {
        world,
        physicsWorld,
        entitiesByName,
        nodesByName: objectsMap,
    };

    for (const item of pendingInitializers) {
        item.initialize?.(
            item.component,
            runtimeContext,
        );
    }

    scene.add(model);

    return entitiesByName.values()
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

        if (colliderConfig.mass) {
            collider.setMass(
                colliderConfig.mass,
            );
        }

        target.rigidBody = rb;
        target.collider = collider;
    }
}