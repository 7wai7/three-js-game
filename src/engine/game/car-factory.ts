import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

import getObjectSize from "../../utils/get-object-size";
import type Engine from "../engine";
import { GROUP_PLAYER, GROUP_VEHICLE, GROUP_WHEEL, GROUP_WORLD, interactionGroups } from "./physics-groups";
import { resolveSpawnTransform, type SpawnTransform } from "../../utils/spawn-transform";

const COLLIDER_SHAPE = ["BOX", "BALL", "CAPSULE", "CYLINDER"] as const;
type ColliderShape = typeof COLLIDER_SHAPE[number];

const RIGIDBODY_DESC = ["FIXED", "DYNAMIC", "KINEMATIC"] as const;
type RigidBodyDesc = typeof RIGIDBODY_DESC[number];

const AXIS = ["X", "Y", "Z"];
type Axis = typeof AXIS[number];

type CreatedPhysicsObject = {
    mesh: any;
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    entity?: number
}

type ColliderDefinition = {
    mesh: THREE.Object3D;
    colliderMarker: THREE.Object3D;
    shape: ColliderShape,
    rigidBodyDesc: RigidBodyDesc,
    axis: Axis
};

export async function createCar(
    engine: Engine,
    transform?: Omit<SpawnTransform, "rotation">
) {
    const { world, physicsWorld, scene, assets } = engine;
    const { position } = resolveSpawnTransform(transform);

    const gltf = await assets.gltf.loadModel(
        "src/assets/car.glb",
    );

    const root = gltf.scene;

    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;

            if (obj.name.startsWith("COL_")) obj.visible = false;
        }
    });

    scene.add(root);




    const colliderDefinitions = extractPhysicsDefinitions(root);
    const physics = createPhysicsFromDefinitions(
        colliderDefinitions,
        physicsWorld
    )

    const physicsMap = new Map(
        physics.map((p) => [p.mesh.name, p]),
    );

    for (const data of physics) {
        const entity = world.createEntity();
        const p = physicsMap.get(data.mesh.name);
        if (p) p.entity = entity;

        world.addComponent(entity, new Object3DComponent(data.mesh));
        world.addComponent(entity, new ColliderComponent(data.collider));
        world.addComponent(entity, new RigidBodyComponent(data.rigidBody));
    }

    const chassis = physicsMap.get("Chassis")!;
    const fl = physicsMap.get("FL")!;
    const fr = physicsMap.get("FR")!;
    const bl = physicsMap.get("BL")!;
    const br = physicsMap.get("BR")!;

    const wheels = [fl, fr, bl, br];



    for (const w of wheels) {
        createWheelJoint(
            physicsWorld,
            chassis.rigidBody,
            w.rigidBody,
        );
    }

    chassis.rigidBody.setTranslation(position, true);
    chassis.collider.setMass(1000);
    chassis.collider.setDensity(100);
    chassis.collider.setRestitution(0);
    chassis.rigidBody.setLinearDamping(0.2);
    chassis.rigidBody.setAngularDamping(1.0);

    chassis.collider.setCollisionGroups(
        interactionGroups(
            GROUP_VEHICLE,
            GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER
        )
    )

    for (const w of wheels) {
        const pos = w.rigidBody.translation();
        const p = new THREE.Vector3(pos.x, pos.y, pos.z).add(position);
        w.rigidBody.setTranslation(p, true);
        w.collider.setMass(200);
        w.collider.setDensity(500);
        w.collider.setRestitution(0);
        w.collider.setFriction(0);
        w.collider.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);
        w.rigidBody.setLinearDamping(0.1);
        w.rigidBody.setAngularDamping(0.1);
        w.rigidBody.enableCcd(true);

        w.collider
            .setCollisionGroups(
                interactionGroups(
                    GROUP_WHEEL,
                    GROUP_WORLD | GROUP_PLAYER
                )
            );
    }

    return chassis.entity
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

function createPhysicsFromDefinitions(
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

function createWheelJoint(
    physicsWorld: RAPIER.World,
    chassis: RAPIER.RigidBody,
    wheel: RAPIER.RigidBody,
) {
    const chassisPos = chassis.translation();
    const wheelPos = wheel.translation();

    const anchor1 = {
        x: wheelPos.x - chassisPos.x,
        y: wheelPos.y - chassisPos.y,
        z: wheelPos.z - chassisPos.z,
    };

    const anchor2 = {
        x: 0,
        y: 0,
        z: 0,
    };

    const axis = {
        x: 0,
        y: 1,
        z: 0,
    };

    const joint = RAPIER.JointData.prismatic(
        anchor1,
        anchor2,
        axis,
    );

    const j = physicsWorld.createImpulseJoint(
        joint,
        chassis,
        wheel,
        true,
    ) as RAPIER.PrismaticImpulseJoint;

    j.setLimits(
        -0.25,
        0.25,
    );

    j.configureMotorPosition(
        -0.25,
        300,
        40,
    );

    // wheel.setEnabledRotations(
    //     false,
    //     true,
    //     false,
    //     true,
    // );
}