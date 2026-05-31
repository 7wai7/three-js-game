import * as THREE from "three";
import PlayerControllerComponent from "../components/player-controller";
import Query from "../ecs/query";
import System from "./system";
import RigidBodyComponent from "../components/rigidbody";
import ColliderComponent from "../components/collider";
import AnimationComponent from "../components/animation";

export default class PlayerControllerSystem extends System {
    forwardAxis = new THREE.Vector3(0, 0, 1);
    rightAxis = new THREE.Vector3(1, 0, 0);

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
            const anim = this.world.getComponent(entity, AnimationComponent)!;
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

            if (controller.jumpRequested && controller.isGrounded) {
                controller.verticalVelocity = controller.jumpForce;
                controller.isGrounded = false;
                anim.requestAnimation("Jumping Up", {
                    loop: false
                })
            }

            controller.jumpRequested = false;

            controller.verticalVelocity +=
                g.y *
                controller.gravityScale *
                this.dt;

            desiredMovement.y = controller.verticalVelocity;

            desiredMovement.multiplyScalar(this.dt);

            characterController.computeColliderMovement(collider, desiredMovement);

            const correctedMovement = characterController.computedMovement();
            const currentPosition = rigidBody.translation();

            rigidBody.setNextKinematicTranslation({
                x: currentPosition.x + correctedMovement.x,
                y: currentPosition.y + correctedMovement.y,
                z: currentPosition.z + correctedMovement.z
            });

            controller.isGrounded =
                characterController.computedGrounded();

            if (controller.isGrounded && controller.verticalVelocity < 0) {
                controller.verticalVelocity = 0;
            }

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

            if (!controller.isGrounded) {
                if (controller.verticalVelocity < 0) {
                    anim.requestAnimation("Fall", {
                        fadeTime: 1
                    });
                }
            }

            if (!controller.jumpRequested && controller.isGrounded) {
                if (isMove) {
                    anim.requestAnimation(
                        controller.isRunning
                            ? "Run"
                            : "Walk"
                    );
                } else {
                    anim.requestAnimation("Idle")
                }
            }
        }
    }
}