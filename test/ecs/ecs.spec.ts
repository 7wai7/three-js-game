import { describe, it, expect } from "vitest";

import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d";

import Object3D from "../../src/engine/components/object";
import World from "../../src/engine/ecs/world";
import RigidBody from "../../src/engine/components/rigidbody";

describe("ecs tests", () => {
    it("returns entities with required components", () => {
        const world = new World();

        const entity = world.createEntity("test");

        const mockRigidBody = {} as RAPIER.RigidBody;

        world.addComponent(entity, new Object3D(new THREE.Object3D()));
        world.addComponent(entity, new RigidBody(mockRigidBody));

        const entities = world.entitiesWith(
            Object3D,
            RigidBody,
        );

        expect([...entities]).toEqual([entity]);
    });
});