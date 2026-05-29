import * as THREE from "three";
import PlayerControllerComponent from "../components/player-controller";
import Query from "../ecs/query";
import System from "./system";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";
import AnimationComponent from "../components/animation";
import AnimationsSystem from "./animations.system";

export default class PlayerControllerSystem extends System {
    animSystem!: AnimationsSystem;
    forwardAxis = new THREE.Vector3(0, 0, 1);
    rightAxis = new THREE.Vector3(1, 0, 0);

    start(): void {
        this.animSystem = this.world.getSystem(AnimationsSystem);
    }

    update(): void {
        const entities = Query.entitiesWith(this.world,
            PlayerControllerComponent,
            RigidBodyComponent,
            ColliderComponent
        );

        for (const entity of entities) {
            const controller = this.world.getComponent(entity, PlayerControllerComponent)!;
            const characterController = controller.characterController;
            const rigidBody = this.world.getComponent(entity, RigidBodyComponent)!.rigidBody;
            const collider = this.world.getComponent(entity, ColliderComponent)!.collider;
            const animComponent = this.world.getComponent(entity, AnimationComponent);
            let isMove = false;

            if (controller.inputMoveDir.lengthSq() > 0) {
                controller.inputMoveDir.normalize();
                isMove = true;
            }

            const speed = controller.isRunning ? controller.runSpeed : controller.speed; // units per second
            const g = this.physicsWorld.gravity;
            const desiredMovement = new THREE.Vector3();

            desiredMovement.copy(controller.inputMoveDir)
                .multiplyScalar(speed);

            desiredMovement.y += g.y;

            desiredMovement.multiplyScalar(this.dt);

            characterController.computeColliderMovement(collider, desiredMovement);

            const correctedMovement = characterController.computedMovement();
            const currentPosition = rigidBody.translation();

            rigidBody.setNextKinematicTranslation({
                x: currentPosition.x + correctedMovement.x,
                y: currentPosition.y + correctedMovement.y,
                z: currentPosition.z + correctedMovement.z
            });

            if (isMove) {
                const targetAngle = Math.atan2(
                    controller.inputMoveDir.x,
                    controller.inputMoveDir.z,
                );


                const q = rigidBody.rotation();
                const currentQuat = new THREE.Quaternion(q.x, q.y, q.z, q.w);

                const euler = new THREE.Euler().setFromQuaternion(currentQuat, "YXZ");
                const currentAngle = euler.y;

                // normalizing the difference (-PI..PI) to avoid taking the long way around
                let delta = targetAngle - currentAngle;
                delta = Math.atan2(Math.sin(delta), Math.cos(delta));

                const newAngle =
                    Math.abs(delta) < 0.001
                        ? targetAngle
                        : currentAngle + delta * Math.min(1, controller.turnSpeed * this.engine.deltaTime);

                const newQuat = new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, newAngle, 0),
                );

                rigidBody.setNextKinematicRotation(newQuat);
            }

            if (animComponent) {
                if (isMove) {
                    if (controller.isRunning) this.animSystem.playAnimation(entity, "FastRun");
                    else this.animSystem.playAnimation(entity, "Walk");
                } else {
                    this.animSystem.playAnimation(entity, "Idle");
                }
            }
        }
    }
}