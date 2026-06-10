import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { PHYSICS_NAME_PREFIX, type ColliderDefinition, type ColliderDefUserData, type ColliderShape, type JointDefinition, type JointDefUserData, type PhysicsNodeMap, type RigidBodyType } from "./types";
import { getObjectSize } from "../../utils/get-object-size";
import { createWheelSuspensionJoint, getAxisDimensions, getColliderRotationByAxis } from "./utils";

function isAllowedPhysicsNamePrefix(name: string) {
    return Object.values(PHYSICS_NAME_PREFIX).some(prefix => name.startsWith(prefix));
}

export function extractPhysicsDefinitions(
    root: THREE.Object3D,
    objectsMap: PhysicsNodeMap
) {
    root.traverse((obj) => {
        if (isAllowedPhysicsNamePrefix(obj.name)) {
            objectsMap.set(
                obj.name,
                {
                    source: obj
                }
            );
        }
    });

    for (const value of objectsMap.values()) {
        const obj = value.source;

        if (obj.name.startsWith(PHYSICS_NAME_PREFIX.COLLIDER)) {
            const data = obj.userData as ColliderDefUserData;
            obj.visible = false;

            const def: ColliderDefinition = {
                targetName: data.targetName,
                shape: (data.shape ?? "BOX").toUpperCase() as ColliderShape,
                rigidbodyType: (data.rigidbodyType ?? "DYNAMIC").toUpperCase() as RigidBodyType,
                axis: (data.axis ?? "Y").toUpperCase(),
            }

            value.colliderDef = def;
            continue;
        }

        if (obj.name.startsWith(PHYSICS_NAME_PREFIX.JOINT)) {
            const data = obj.userData as JointDefUserData;

            if (!data.targetName) {
                console.warn(
                    `Joint ${obj.name} missing userData.target`,
                );
                continue;
            }

            const target = objectsMap.get(data.targetName);
            if (!target) {
                console.warn(
                    `Joint target object not found by name ${data.targetName}`,
                );
                continue;
            }

            const distance =
                obj.position.distanceTo(
                    target.source.position,
                );

            const direction =
                target.source.position
                    .clone()
                    .sub(obj.position)
                    .normalize();

            const def: JointDefinition = {
                targetName: target.source.name,
                jointType:
                    obj.userData.type ?? "suspension",
                distance,
                direction,
            }

            value.jointDef = def;
        }
    }
}

export function createPhysicsObjectsFromDefinitions(
    physicsWorld: RAPIER.World,
    objectsMap: PhysicsNodeMap,
) {
    for (const value of objectsMap.values()) {
        const def = value.colliderDef;
        if (!def) continue;

        const target = objectsMap.get(def.targetName);
        if (!target) {
            console.log("=== Creating Physics Objects From Definitions ===");
            console.warn(`Target 3D Object not found by name "${def.targetName}"`);
            continue;
        }

        const meshWorldPos = new THREE.Vector3();
        const meshWorldQuat = new THREE.Quaternion();

        target.source.getWorldPosition(meshWorldPos);
        target.source.getWorldQuaternion(meshWorldQuat);

        const size = getObjectSize(value.source);

        let rbDesc: RAPIER.RigidBodyDesc;

        switch (def.rigidbodyType) {
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
            getAxisDimensions(size, def.axis.toLowerCase() as "x" | "y" | "z");

        switch (def.shape) {
            case "BALL": {
                const radius =
                    Math.max(size.x, size.y, size.z) * 0.5;

                colliderDesc =
                    RAPIER.ColliderDesc.ball(radius);

                break;
            }

            case "CAPSULE": {
                const halfHeight =
                    Math.max(0, length * 0.5 - radius);

                colliderDesc =
                    RAPIER.ColliderDesc.capsule(
                        halfHeight,
                        radius,
                    );

                break;
            }

            case "CYLINDER": {
                colliderDesc =
                    RAPIER.ColliderDesc.cylinder(
                        length * 0.5,
                        radius,
                    );

                break;
            }

            default: {
                colliderDesc =
                    RAPIER.ColliderDesc.cuboid(
                        size.x * 0.5,
                        size.y * 0.5,
                        size.z * 0.5,
                    );

                break;
            }
        }

        const localPos = new THREE.Vector3();

        target.source.updateMatrixWorld(true);
        value.source.updateMatrixWorld(true);

        const inverseMeshMatrix =
            target.source.matrixWorld.clone().invert();

        const localMatrix =
            inverseMeshMatrix.multiply(
                value.source.matrixWorld.clone(),
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




        const localQuat = getColliderRotationByAxis(def.axis);

        colliderDesc.setRotation({
            x: localQuat.x,
            y: localQuat.y,
            z: localQuat.z,
            w: localQuat.w,
        });

        const collider = physicsWorld.createCollider(
            colliderDesc,
            rb,
        );


        value.rigidBody = rb;
        value.collider = collider;
    }
}

export function createJointsFromDefinitions(
    physicsWorld: RAPIER.World,
    objectsMap: PhysicsNodeMap
) {
    for (const value of objectsMap.values()) {
        const def = value.jointDef;
        if (!def) continue;

        const target = objectsMap.get(def.targetName);
        if (!target) {
            console.log("=== Creating Joints From Definitions ===");
            console.warn(`Target 3D Object not found by name "${def.targetName}"`);
            continue;
        }


        if (!target.rigidBody || !value.rigidBody) continue;

        switch (def.jointType) {
            case "suspension":
                const size = getObjectSize(value.source);
                const { radius } =
                    getAxisDimensions(size, value.colliderDef!.axis.toLowerCase() as "x" | "y" | "z");

                createWheelSuspensionJoint(
                    physicsWorld,
                    target.rigidBody,
                    value.rigidBody,
                    {
                        max: def.distance - radius,
                    },
                );
                break;

            default:
                console.warn(
                    `Unknown joint type ${def.jointType}`,
                );
        }
    }
}
