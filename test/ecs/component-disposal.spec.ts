import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d/rapier.js";
import { beforeEach, describe, expect, it } from "vitest";

import Collider from "../../src/engine/components/collider";
import RigidBody from "../../src/engine/components/rigidbody";
import EngineContext from "../../src/engine/contexts/engine.context";
import type Engine from "../../src/engine/engine";
import GameWorld from "../../src/engine/game/game-world";

function mockEngineContext() {
    EngineContext.setEngine({
        world: new GameWorld(),
        physicsWorld: new RAPIER.World({
            x: 0,
            y: -9.81,
            z: 0,
        }),
        deltaTime: 0,
    } as Engine);
}

function createDynamicBodyWithCollider(
    physicsWorld: RAPIER.World,
    translation = { x: 0, y: 0, z: 0 },
) {
    const rigidBody = physicsWorld.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(
                translation.x,
                translation.y,
                translation.z,
            ),
    );

    const collider = physicsWorld.createCollider(
        RAPIER.ColliderDesc.ball(0.5),
        rigidBody,
    );

    return {
        rigidBody,
        collider,
    };
}

describe("physics components disposal", () => {
    let engine: Engine;
    let world: GameWorld;
    let physicsWorld: RAPIER.World;

    beforeEach(() => {
        mockEngineContext();
        engine = EngineContext.engine;
        world = engine.world;
        physicsWorld = engine.physicsWorld;
    });

    it("defers real Rapier RigidBody and attached Collider removal until flush", () => {
        const { rigidBody, collider } =
            createDynamicBodyWithCollider(physicsWorld);

        const entity = world.createEntity("entity");
        world.addComponent(entity, new RigidBody(rigidBody));
        world.addComponent(entity, new Collider(collider));

        world.destroyEntity(entity);

        expect(world.getComponent(entity, RigidBody)).toBeUndefined();
        expect(world.getComponent(entity, Collider)).toBeUndefined();
        expect(rigidBody.isValid()).toBe(true);
        expect(collider.isValid()).toBe(true);

        world.flushDisposedComponents();

        expect(rigidBody.isValid()).toBe(false);
        expect(collider.isValid()).toBe(false);
    });

    it("removes a standalone real Rapier Collider on flush", () => {
        const collider = physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5),
        );

        const entity = world.createEntity("entity");
        world.addComponent(entity, new Collider(collider));

        world.removeComponent(entity, Collider);

        expect(world.getComponent(entity, Collider)).toBeUndefined();
        expect(collider.isValid()).toBe(true);

        world.flushDisposedComponents();

        expect(collider.isValid()).toBe(false);
    });

    it("disposes replaced real Rapier RigidBodies only after flush", () => {
        const previous =
            createDynamicBodyWithCollider(physicsWorld, { x: 0, y: 0, z: 0 });
        const next =
            createDynamicBodyWithCollider(physicsWorld, { x: 1, y: 0, z: 0 });

        const entity = world.createEntity("entity");
        world.addComponent(entity, new RigidBody(previous.rigidBody));
        world.addComponent(entity, new RigidBody(next.rigidBody));

        expect(previous.rigidBody.isValid()).toBe(true);
        expect(previous.collider.isValid()).toBe(true);
        expect(next.rigidBody.isValid()).toBe(true);
        expect(next.collider.isValid()).toBe(true);

        world.removeComponent(entity, RigidBody);

        expect(previous.rigidBody.isValid()).toBe(true);
        expect(next.rigidBody.isValid()).toBe(true);

        world.flushDisposedComponents();

        expect(previous.rigidBody.isValid()).toBe(false);
        expect(previous.collider.isValid()).toBe(false);
        expect(next.rigidBody.isValid()).toBe(false);
        expect(next.collider.isValid()).toBe(false);

        world.flushDisposedComponents();

        expect(previous.rigidBody.isValid()).toBe(false);
        expect(next.rigidBody.isValid()).toBe(false);
    });

    it("recursively destroys world child entities and their real Rapier physics", () => {
        const rootObject = new THREE.Object3D();
        const childObject = new THREE.Object3D();
        rootObject.add(childObject);

        const rootPhysics =
            createDynamicBodyWithCollider(physicsWorld, { x: 0, y: 0, z: 0 });
        const childPhysics =
            createDynamicBodyWithCollider(physicsWorld, { x: 0, y: 1, z: 0 });

        const rootEntity = world.createGameObject(rootObject);
        const childEntity = world.createGameObject(childObject);

        world.addComponent(
            rootEntity,
            new RigidBody(rootPhysics.rigidBody),
        );
        world.addComponent(
            rootEntity,
            new Collider(rootPhysics.collider),
        );
        world.addComponent(
            childEntity,
            new RigidBody(childPhysics.rigidBody),
        );
        world.addComponent(
            childEntity,
            new Collider(childPhysics.collider),
        );

        world.destroyEntity(rootEntity);

        expect(world.entities.has(rootEntity)).toBe(false);
        expect(world.entities.has(childEntity)).toBe(false);
        expect(world.gameObjects.has(rootEntity)).toBe(false);
        expect(world.gameObjects.has(childEntity)).toBe(false);
        expect(rootObject.parent).toBeNull();
        expect(rootPhysics.rigidBody.isValid()).toBe(true);
        expect(childPhysics.rigidBody.isValid()).toBe(true);

        world.flushDisposedComponents();

        expect(rootPhysics.rigidBody.isValid()).toBe(false);
        expect(rootPhysics.collider.isValid()).toBe(false);
        expect(childPhysics.rigidBody.isValid()).toBe(false);
        expect(childPhysics.collider.isValid()).toBe(false);
    });
});
