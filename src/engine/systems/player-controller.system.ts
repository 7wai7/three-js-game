import * as THREE from "three";
import PlayerControllerComponent from "../components/player-controller";
import Query from "../ecs/query";
import System from "./system";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";

export default class PlayerControllerSystem extends System {
    update(): void {
        const entities = Query.entitiesWith(this.world,
            PlayerControllerComponent,
            RigidBodyComponent,
            ColliderComponent
        );

        for (const entity of entities) {
            const controller = this.world.getComponent(entity, PlayerControllerComponent)!.controller;
            const rigidBody = this.world.getComponent(entity, RigidBodyComponent)!.rigidBody;
            const collider = this.world.getComponent(entity, ColliderComponent)!.collider;

            const h = this.input.vertical();
            const v = this.input.horizontal();

            const speed = 5; // units per second
            const dt = this.dt;
            const g = this.physicsWorld.gravity;

            const inputDir = new THREE.Vector3(h, 0, v);
            if (inputDir.lengthSq() > 0) {
                inputDir.normalize();
            }

            const desiredMovement = new THREE.Vector3();

            desiredMovement.copy(inputDir)
                .multiplyScalar(speed);

            desiredMovement.y += g.y;

            desiredMovement.multiplyScalar(dt);

            controller.computeColliderMovement(collider, desiredMovement);

            const correctedMovement = controller.computedMovement();
            const currentPosition = rigidBody.translation();

            rigidBody.setNextKinematicTranslation({
                x: currentPosition.x + correctedMovement.x,
                y: currentPosition.y + correctedMovement.y,
                z: currentPosition.z + correctedMovement.z
            });
        }
    }
}