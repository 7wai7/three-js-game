import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

import type World from "../ecs/world";
import getObjectSize from "../../utils/get-object-size";
import type GLTFAssetManager from "../assets/gltf-asset-manager";

const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
type ColliderShape = typeof COLLIDER_SHAPE[number];

const RIGIDBODY_DESC = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
type RigidBodyDesc = typeof RIGIDBODY_DESC[number];

const AXIS = ["X", "Y", "Z"];
type Axis = typeof AXIS[number];

type ColliderDefinition = {
    mesh: THREE.Object3D;
    colliderMarker: THREE.Object3D;
    shape: ColliderShape,
    rigidBodyDesc: RigidBodyDesc,
    axis: Axis
};

export async function createCar(
    world: World,
    physicsWorld: RAPIER.World,
    scene: THREE.Scene,
    assets: GLTFAssetManager
) {
    const carEntity = world.createEntity();

    // =========================
    // LOAD MODEL
    // =========================

    const gltf = await assets.loadModel(
        "src/assets/car.glb",
    );

    const root = gltf.scene;
    console.log(root)

    // root.position.y = 3;
    // root.visible = false;

    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;

            if (obj.name.startsWith("COL_")) obj.visible = false;
        }
    });

    scene.add(root);




    const colliderDefinitions = extractPhysicsDefinitions(root);
    console.log(colliderDefinitions)

    const physics = createPhysicsObjects(
        colliderDefinitions,
        physicsWorld
    )
    console.log(physics)



    for (const data of physics) {
        const entity = world.createEntity();
        world.addComponent(entity, new Object3DComponent(data.mesh));
        world.addComponent(entity, new ColliderComponent(data.collider));
        world.addComponent(entity, new RigidBodyComponent(data.rigidBody));
    }

    return {
        car: carEntity
    }
}


// utils
function extractPhysicsDefinitions(root: THREE.Object3D) {
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

function createPhysicsObjects(
    defs: ColliderDefinition[],
    physicsWorld: RAPIER.World,
) {
    const result = [];

    for (const def of defs) {
        const meshWorldPos = new THREE.Vector3();
        const meshWorldQuat = new THREE.Quaternion();

        def.mesh.getWorldPosition(meshWorldPos);
        def.mesh.getWorldQuaternion(meshWorldQuat);

        const size = getObjectSize(def.colliderMarker);
        console.log(`Shape: ${def.shape}, desc: ${def.rigidBodyDesc}, axis: ${def.axis}, size: ${size.toArray()}`)

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




        const localQuat = getColliderRotation(def.axis);

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

function getColliderRotation(axis: Axis) {
    switch (axis) {
        case "X":
            return new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, 0, Math.PI / 2),
            );

        case "Z":
            return new THREE.Quaternion().setFromEuler(
                new THREE.Euler(Math.PI / 2, 0, 0),
            );

        default:
            return new THREE.Quaternion();
    }
}

function getAxisDimensions(
    size: THREE.Vector3,
    axis: "x" | "y" | "z",
) {
    switch (axis) {
        case "x":
            return {
                length: size.x,
                radius: Math.max(size.y, size.z) * 0.5,
            };

        case "y":
            return {
                length: size.y,
                radius: Math.max(size.x, size.z) * 0.5,
            };

        case "z":
            return {
                length: size.z,
                radius: Math.max(size.x, size.y) * 0.5,
            };
    }
}