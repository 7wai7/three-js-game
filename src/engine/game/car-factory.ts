import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

import type Engine from "../engine";
import { GROUP_PLAYER, GROUP_VEHICLE, GROUP_WHEEL, GROUP_WORLD, interactionGroups } from "./physics-groups";
import { resolveSpawnTransform, type SpawnTransform } from "../../utils/spawn-transform";
import { createJointsFromDefinitions, createPhysicsObjectsFromDefinitions, extractPhysicsDefinitions } from "../gen-physics-by-model-markers/collider-definition";
import CarComponent, { type CarParameters } from "../components/vehicle/car";
import WheelComponent from "../components/vehicle/wheel";
import PlayerInputComponent from "../components/player-input";
import type { PhysicsNodeMap } from "../gen-physics-by-model-markers/types";
import { prepareWheelSteeringPivots } from "../gen-physics-by-model-markers/utils";

type CreateCarData = {
    transform?: Omit<SpawnTransform, "rotation">,
    chassisMass?: number,
    wheelMass?: number,
} & Partial<CarParameters>

export async function createCar(
    engine: Engine,
    path: string,
    {
        transform,
        chassisMass = 700,
        wheelMass = 100,
        ...carParameters
    }: CreateCarData
) {
    const { world, physicsWorld, scene, assets } = engine;
    const { position } = resolveSpawnTransform(transform);

    const gltf = await assets.gltf.loadModel(path);
    const root = gltf.scene;

    let hasChassis = false;
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }

        if (obj.name === "PH_chassis") hasChassis = true;
    });

    if (!hasChassis) {
        throw new Error(`Chassis not found`);
    }


    const objectsMap: PhysicsNodeMap = new Map();

    extractPhysicsDefinitions(root, objectsMap);
    createPhysicsObjectsFromDefinitions(
        physicsWorld,
        objectsMap
    );
    createJointsFromDefinitions(
        physicsWorld,
        objectsMap
    )


    const chassis = objectsMap.get("PH_chassis")!;

    const wheels = prepareWheelSteeringPivots(objectsMap);

    // createSuspensionsFromDefinitions(suspensionDefs);

    // for (const w of wheels) {
    //     createWheelSuspensionJoint(
    //         physicsWorld,
    //         chassis.rigidBody,
    //         w.rigidBody,
    //     );
    // }

    if(!chassis.rigidBody || !chassis.collider) {
        console.log("Error to create car");
        return;
    }

    chassis.rigidBody.setTranslation(position, true);
    chassis.collider.setMass(chassisMass);
    chassis.collider.setRestitution(0);
    chassis.rigidBody.setLinearDamping(0.2);
    chassis.rigidBody.setAngularDamping(0.2);

    chassis.collider.setCollisionGroups(
        interactionGroups(
            GROUP_VEHICLE,
            GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER
        )
    )

    for (const w of wheels) {
        if(!w.rigidBody || !w.collider) {
            console.log(`Error create wheel "${w.source.name}"`);
            continue;
        }
        
        const pos = w.rigidBody.translation();
        const p = new THREE.Vector3(pos.x, pos.y, pos.z).add(position);
        w.rigidBody.setTranslation(p, true);
        w.collider.setMass(wheelMass);
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


    const chassisEntity = world.createEntity();
    world.addComponent(chassisEntity, new PlayerInputComponent());
    world.addComponent(chassisEntity, new Object3DComponent(chassis.source));
    world.addComponent(chassisEntity, new ColliderComponent(chassis.collider));
    world.addComponent(chassisEntity, new RigidBodyComponent(chassis.rigidBody));
    const carComponent = world.addComponent(chassisEntity, new CarComponent(carParameters));

    for (const w of wheels) {
        if(!w.rigidBody || !w.collider || !w.steerPivot) {
            console.log(`Error addd wheel "${w.source.name}" to world`);
            continue;
        }
        
        const entity = world.createEntity();

        // set empty object as primary object for physics synchronization
        world.addComponent(entity, new Object3DComponent(w.steerPivot));
        world.addComponent(entity, new ColliderComponent(w.collider));
        world.addComponent(entity, new RigidBodyComponent(w.rigidBody));
        const wheelComponent = world.addComponent(entity, new WheelComponent(chassisEntity));

        carComponent.wheels.push(entity);
        if (w.source.userData.maxSteerAngleDeg) wheelComponent.maxSteerAngle = THREE.MathUtils.DEG2RAD * w.source.userData.maxSteerAngleDeg;
        if (w.source.userData.isRear) wheelComponent.isRear = w.source.userData.isRear;
    }

    scene.add(root);
    return {
        entity: chassisEntity,
        object3D: root,
    }
}
