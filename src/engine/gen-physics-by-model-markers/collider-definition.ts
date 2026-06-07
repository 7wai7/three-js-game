import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { type ColliderDefinition, type ColliderShape, type PhysicsObject, type RigidBodyType, type VehiclePhysicsObject } from "./types";
import { getObjectSize } from "../../utils/get-object-size";
import { getAxisDimensions, getColliderRotationByAxis } from "./utils";

export function buildPhysicsBy3dDefinitions(
    root: THREE.Object3D,
    physicsWorld: RAPIER.World,
) {
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            if (obj.name.startsWith("COL_")) obj.visible = false;
        }
    });

    const definitions = extractCollidersDefinitions(root);
    const physicsObjects = createCollidersFromDefinitions(
        definitions,
        physicsWorld
    )

    return physicsObjects;
}

export function extractCollidersDefinitions(root: THREE.Object3D) {
    const result: ColliderDefinition[] = [];

    root.traverse((obj) => {
        if (!obj.name.startsWith("COL_")) return;
        if (!obj.parent) return;

        const data = obj.userData;

        const shape = data.shape ? (data.shape as string).toUpperCase() : "BOX";
        const rigidbodyType = data.rigidbodyType ? (data.rigidbodyType as string).toUpperCase() : "DYNAMIC";
        const axis = data.axis ? (data.axis as string).toUpperCase() : "Y";

        result.push({
            mesh: obj.parent,
            colliderMarker: obj,
            shape: shape as ColliderShape,
            rigidbodyType: rigidbodyType as RigidBodyType,
            axis
        });
    });

    return result;
}

export function createCollidersFromDefinitions(
    defs: ColliderDefinition[],
    physicsWorld: RAPIER.World,
): PhysicsObject[] {
    const result = [];

    for (const def of defs) {
        const meshWorldPos = new THREE.Vector3();
        const meshWorldQuat = new THREE.Quaternion();

        def.mesh.getWorldPosition(meshWorldPos);
        def.mesh.getWorldQuaternion(meshWorldQuat);

        const size = getObjectSize(def.colliderMarker);

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

        def.mesh.updateMatrixWorld(true);
        def.colliderMarker.updateMatrixWorld(true);

        const inverseMeshMatrix =
            def.mesh.matrixWorld.clone().invert();

        const localMatrix =
            inverseMeshMatrix.multiply(
                def.colliderMarker.matrixWorld.clone(),
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

        result.push({
            mesh: def.mesh,
            rigidBody: rb,
            collider,
        });
    }

    return result;
}

export function prepareWheelSteeringPivots(physicsObjects: PhysicsObject[]) {
    const wheels = [];
    for (const obj of physicsObjects) {
        if (!obj.mesh.name.startsWith("wheel")) continue;
        if (!obj.mesh.parent) {
            console.warn(`Wheel ${obj.mesh.name} doesn't have parent object`);
            continue;
        }

        wheels.push(obj);

        const steerPivot = new THREE.Object3D();

        obj.mesh.parent.attach(steerPivot);
        steerPivot.attach(obj.mesh);
        obj.mesh.position.set(0, 0, 0);
        (obj as VehiclePhysicsObject).steerPivot = steerPivot;
    }

    return {
        vehiclePhysicsObjects: physicsObjects as VehiclePhysicsObject[],
        wheels: wheels as VehiclePhysicsObject[]
    }
}