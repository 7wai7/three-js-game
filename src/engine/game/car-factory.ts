import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

import type Engine from "../engine";
import { GROUP_PLAYER, GROUP_VEHICLE, GROUP_WHEEL, GROUP_WORLD, interactionGroups } from "./physics-groups";
import { resolveSpawnTransform, type SpawnTransform } from "../../utils/spawn-transform";
import { extractAndCreateCollidersByDefinitions } from "../gen-physics-by-model-markers/collider-definition";
import { createWheelSuspensionJoint } from "../gen-physics-by-model-markers/utils";
import CarComponent from "../components/vehicle/car";
import WheelComponent from "../components/vehicle/wheel";
import PlayerInputComponent from "../components/player-input";

export async function createCar(
    engine: Engine,
    path: string,
    transform?: Omit<SpawnTransform, "rotation">
) {
    const { world, physicsWorld, scene, assets } = engine;
    const { position } = resolveSpawnTransform(transform);

    const gltf = await assets.gltf.loadModel(path);
    const root = gltf.scene;

    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });


    const { map } = extractAndCreateCollidersByDefinitions(
        root,
        physicsWorld
    )

    const chassis = map.get("Chassis")!;
    const fl = map.get("FL")!;
    const fr = map.get("FR")!;
    const bl = map.get("BL")!;
    const br = map.get("BR")!;

    const frontWheels = [fl, fr];
    const rearWheels = [bl, br];
    const wheels = [...frontWheels, ...rearWheels];

    for (const w of wheels) {
        createWheelSuspensionJoint(
            physicsWorld,
            chassis.rigidBody,
            w.rigidBody,
        );
    }

    chassis.rigidBody.setTranslation(position, true);
    chassis.collider.setMass(10);
    chassis.collider.setDensity(100);
    chassis.collider.setRestitution(0);
    chassis.rigidBody.setLinearDamping(1);
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
        w.collider.setMass(20);
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


    const chassisEntity = world.createEntity();
    world.addComponent(chassisEntity, new PlayerInputComponent());
    world.addComponent(chassisEntity, new Object3DComponent(chassis.mesh));
    world.addComponent(chassisEntity, new ColliderComponent(chassis.collider));
    world.addComponent(chassisEntity, new RigidBodyComponent(chassis.rigidBody));
    const carComponent = world.addComponent(chassisEntity, new CarComponent());

    for (const w of frontWheels) {
        const entity = world.createEntity();
        world.addComponent(entity, new Object3DComponent(w.mesh));
        world.addComponent(entity, new ColliderComponent(w.collider));
        world.addComponent(entity, new RigidBodyComponent(w.rigidBody));
        const wheelComponent = world.addComponent(entity, new WheelComponent(chassisEntity));

        carComponent.wheels.push(entity);
        wheelComponent.maxSteerAngle = 30;
        wheelComponent.isRear = false;
    }

    for (const w of rearWheels) {
        const entity = world.createEntity();
        world.addComponent(entity, new Object3DComponent(w.mesh));
        world.addComponent(entity, new ColliderComponent(w.collider));
        world.addComponent(entity, new RigidBodyComponent(w.rigidBody));
        const wheelComponent = world.addComponent(entity, new WheelComponent(chassisEntity));

        carComponent.wheels.push(entity);
        wheelComponent.maxSteerAngle = 0;
        wheelComponent.isRear = true;
    }


    scene.add(root);
    return {
        entity: chassisEntity,
        object3D: root,
    }
}
