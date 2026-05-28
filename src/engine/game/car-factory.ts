import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import EngineContext from "../contexts/engine.context";

import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

import type World from "../ecs/world";
import getUniformScale from "../../utils/get-uniform-scale";
import getObjectSize from "../../utils/get-object-size";

type WheelName =
    | "Cylinder"
    | "Cylinder001"
    | "Cylinder002"
    | "Cylinder003";

export async function createCar(
    world: World,
    physicsWorld: RAPIER.World,
    scene: THREE.Scene,
) {
    const carEntity = world.createEntity();

    // =========================
    // LOAD MODEL
    // =========================

    const root = await EngineContext.engine.assets.loadModel(
        "src/assets/car.glb",
    );

    root.position.y = 3;
    // root.visible = false;

    const uniformScale = getUniformScale(root, 1);
    root.scale.setScalar(uniformScale);

    root.updateMatrixWorld(true);

    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    scene.add(root);

    // =========================
    // GET WHEELS
    // =========================

    const wheelNames: WheelName[] = [
        "Cylinder",
        "Cylinder001",
        "Cylinder002",
        "Cylinder003",
    ];

    const wheels = wheelNames.map((name) => {
        const wheel = root.getObjectByName(name);

        if (!wheel) {
            throw new Error(`Wheel "${name}" not found`);
        }

        return wheel;
    });

    // =========================
    // DETACH WHEELS
    // =========================

    const wheelWorldPositions: THREE.Vector3[] = [];

    root.updateMatrixWorld(true);

    for (const wheel of wheels) {
        // save world transform
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        wheel.matrixWorld.decompose(
            worldPos,
            worldQuat,
            worldScale,
        );

        // detach
        // wheel.removeFromParent();

        // restore world transform
        wheel.position.copy(worldPos);
        wheel.quaternion.copy(worldQuat);
        wheel.scale.copy(worldScale);

        wheelWorldPositions.push(worldPos);

        scene.add(wheel);

        wheel.updateMatrixWorld(true);
    }

    // =========================
    // CHASSIS PHYSICS
    // =========================

    const chassis = root.getObjectByName("Cube")!;
    const chassisSize = getObjectSize(chassis);

    const chassisRb = physicsWorld.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0, root.position.y, 0),
    );

    const chassisCollider = physicsWorld.createCollider(
        RAPIER.ColliderDesc.cuboid(
            chassisSize.x * 0.4,
            chassisSize.y * 0.25,
            chassisSize.z * 0.45,
        )
            .setMass(150)
            .setCollisionGroups(0x00010002),
        chassisRb,
    );

    world.addComponent(
        carEntity,
        new Object3DComponent(chassis),
    );

    world.addComponent(
        carEntity,
        new RigidBodyComponent(chassisRb),
    );

    world.addComponent(
        carEntity,
        new ColliderComponent(chassisCollider),
    );

    // =========================
    // CREATE WHEELS
    // =========================

    const wheelsEntities = [];

    for (let i = 0; i < wheels.length; i++) {
        const wheelEntity = world.createEntity();
        wheelsEntities.push(wheelEntity);

        const wheelMesh = wheels[i];
        const wheelPos = wheelWorldPositions[i];

        const size = getObjectSize(wheelMesh);

        const radius = Math.max(size.x, size.z) * 0.5;
        const halfHeight = size.y * 0.5;

        // -------------------------
        // wheel rigidbody
        // -------------------------

        const wheelRb = physicsWorld.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(
                    wheelPos.x,
                    wheelPos.y,
                    wheelPos.z,
                ),
        );

        // -------------------------
        // wheel collider
        // -------------------------

        const colliderDesc = RAPIER.ColliderDesc.cylinder(
            halfHeight * 0.5,
            radius,
        )
            .setCollisionGroups(0x00010001);

        // Rapier cylinder is vertical (Y-axis)
        // rotate to X-axis

        const q = new THREE.Quaternion()
            .setFromEuler(
                new THREE.Euler(0, 0, Math.PI * 0.5),
            );

        colliderDesc.setRotation({
            x: q.x,
            y: q.y,
            z: q.z,
            w: q.w,
        });

        const wheelCollider = physicsWorld.createCollider(
            colliderDesc,
            wheelRb,
        );

        // -------------------------
        // ECS
        // -------------------------

        world.addComponent(
            wheelEntity,
            new Object3DComponent(wheelMesh),
        );

        world.addComponent(
            wheelEntity,
            new RigidBodyComponent(wheelRb),
        );

        world.addComponent(
            wheelEntity,
            new ColliderComponent(wheelCollider),
        );

        // =========================
        // JOINT
        // =========================

        const chassisPos = chassisRb.translation();

        const localAnchor1 = {
            x: wheelPos.x - chassisPos.x,
            y: wheelPos.y - chassisPos.y,
            z: wheelPos.z - chassisPos.z,
        };

        const localAnchor2 = {
            x: 0,
            y: 1,
            z: 0,
        };

        const axis = {
            x: 1,
            y: 0,
            z: 0,
        };

        const jointData = RAPIER.JointData.revolute(
            localAnchor1,
            localAnchor2,
            axis,
        );

        physicsWorld.createImpulseJoint(
            jointData,
            chassisRb,
            wheelRb,
            true,
        );
    }

    return {
        car: carEntity,
        wheels: wheelsEntities,
    };
}