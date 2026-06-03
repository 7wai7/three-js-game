import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { AXIS, COLLIDER_SHAPE, RIGIDBODY_DESC, type Axis, type ColliderDefinition, type CreatedPhysicsObject } from "./types";
import { getObjectSize } from "../../utils/get-object-size";
import { getAxisDimensions, getColliderRotationByAxis } from "./utils";

export function extractAndCreateCollidersByDefinitions(
    root: THREE.Object3D,
    physicsWorld: RAPIER.World,
) {
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            if (obj.name.startsWith("COL_")) obj.visible = false;
        }
    });

    const colliderDefinitions = extractCollidersDefinitions(root);
    return createPhysicsFromDefinitions(
        colliderDefinitions,
        physicsWorld
    )
}

export function extractCollidersDefinitions(root: THREE.Object3D) {
    const result: ColliderDefinition[] = [];

    root.traverse((obj) => {
        if (!obj.name.startsWith("COL_")) return;
        if (!obj.parent) return;

        const parts = obj.name.split("_");

        const shape = COLLIDER_SHAPE.find(shape => obj.name.includes(shape)) ?? "BOX";
        const rigidBodyDesc = RIGIDBODY_DESC.find(desc => obj.name.includes(desc)) ?? "DYNAMIC";

        const axis =
            parts.find(
                (part): part is Axis =>
                    AXIS.includes(part as Axis),
            ) ?? "Y";

        result.push({
            mesh: obj.parent,
            colliderMarker: obj,
            shape,
            rigidBodyDesc,
            axis
        });
    });

    return result;
}

export function createPhysicsFromDefinitions(
    defs: ColliderDefinition[],
    physicsWorld: RAPIER.World,
): CreatedPhysicsObject[] {
    const result = [];

    for (const def of defs) {
        const meshWorldPos = new THREE.Vector3();
        const meshWorldQuat = new THREE.Quaternion();

        def.mesh.getWorldPosition(meshWorldPos);
        def.mesh.getWorldQuaternion(meshWorldQuat);

        const size = getObjectSize(def.colliderMarker);

        let rbDesc: RAPIER.RigidBodyDesc;

        switch (def.rigidBodyDesc) {
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