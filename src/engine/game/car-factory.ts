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
        }
    });


    const physics = extractAndCreateCollidersByDefinitions(
        root,
        physicsWorld
    )

    const physicsMap = new Map(
        physics.map((p) => [p.mesh.name, p]),
    );

    const chassis = physicsMap.get("Chassis")!;
    const fl = physicsMap.get("FL")!;
    const fr = physicsMap.get("FR")!;
    const bl = physicsMap.get("BL")!;
    const br = physicsMap.get("BR")!;

    const wheels = [fl, fr, bl, br];


    const chassisEntity = world.createEntity();
    world.addComponent(chassisEntity, new Object3DComponent(chassis.mesh));
    world.addComponent(chassisEntity, new ColliderComponent(chassis.collider));
    world.addComponent(chassisEntity, new RigidBodyComponent(chassis.rigidBody));

    for (const w of wheels) {
        const entity = world.createEntity();
        world.addComponent(entity, new Object3DComponent(w.mesh));
        world.addComponent(entity, new ColliderComponent(w.collider));
        world.addComponent(entity, new RigidBodyComponent(w.rigidBody));
    }

    for (const w of wheels) {
        createWheelSuspensionJoint(
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


    scene.add(root);
    return chassisEntity
}
