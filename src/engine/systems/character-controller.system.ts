import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import CharacterController from '../components/character-controller';
import System from './system';
import RigidBody from '../components/rigidbody';
import Collider from '../components/collider';
import Animation from '../components/animation';
import ControlInput from '../components/control-input';
import PlayerControlled from '../components/player-controlled';

export default class CharacterControllerSystem extends System {
  forwardAxis = new THREE.Vector3(0, 0, 1);
  rightAxis = new THREE.Vector3(1, 0, 0);
  private cameraForward = new THREE.Vector3();
  private cameraRight = new THREE.Vector3();
  private moveDirection = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);

  update(): void {
    for (const [entity, controller, { rigidBody }, { collider }] of this.world.query(
      CharacterController,
      RigidBody,
      Collider,
    )) {
      const characterController = controller.characterController;
      const anim = this.world.getComponent(entity, Animation)!;
      const input = this.world.getComponent(entity, ControlInput);
      let isMove = false;

      this.resolveMoveDirectionByCamera(entity, input);

      if (this.moveDirection.lengthSq() > 0) {
        this.moveDirection.normalize();
        isMove = true;
      }

      const isRunning = input?.pressed('sprint') ?? false;
      const speed = isRunning ? controller.runSpeed : controller.speed; // units per second
      const g = this.physicsWorld.gravity;
      const desiredMovement = new THREE.Vector3();

      desiredMovement.copy(this.moveDirection).multiplyScalar(speed);

      if (input?.clicked('jump') && controller.isGrounded) {
        controller.verticalVelocity = controller.jumpForce;
        controller.isGrounded = false;
        anim.requestAnimation('Jumping Up', {
          loop: false,
        });
      }

      controller.verticalVelocity += g.y * controller.gravityScale * this.dt;

      controller.verticalVelocity *= 0.977;
      desiredMovement.y = controller.verticalVelocity;
      desiredMovement.multiplyScalar(this.dt);

      characterController.computeColliderMovement(collider, desiredMovement);

      const correctedMovement = characterController.computedMovement();
      const currentPosition = rigidBody.translation();

      rigidBody.setNextKinematicTranslation({
        x: currentPosition.x + correctedMovement.x,
        y: currentPosition.y + correctedMovement.y,
        z: currentPosition.z + correctedMovement.z,
      });

      controller.isGrounded = characterController.computedGrounded();

      if (controller.isGrounded && controller.verticalVelocity < 0) {
        controller.verticalVelocity = 0;
      }

      if (!controller.isGrounded && controller.verticalVelocity < 0) {
        const pos = rigidBody.translation();
        const ray = new RAPIER.Ray(
          {
            x: pos.x,
            y: pos.y - controller.colliderHalfHeight,
            z: pos.z,
          },
          { x: 0, y: -1, z: 0 },
        );

        const toi = 2;
        const hit = this.physicsWorld.castRay(ray, toi, false, undefined, undefined, collider);

        if (hit) {
          if (
            controller.verticalVelocity < 0 &&
            hit &&
            hit.timeOfImpact < controller.landingPredictionDistance
          ) {
            anim.requestAnimation('Jumping Down', {
              loop: false,
            });
          }
        } else {
          anim.requestAnimation('Fall', {
            fadeTime: 1,
          });
        }
      }

      if (isMove) this.turnCharacter(controller, rigidBody, this.moveDirection);

      if (controller.isGrounded) {
        if (isMove) {
          anim.requestAnimation(isRunning ? 'Run' : 'Walk');
        } else {
          anim.requestAnimation('Idle');
        }
      }
    }
  }

  private resolveMoveDirectionByCamera(entity: string, input?: ControlInput) {
    this.moveDirection.set(0, 0, 0);

    if (!input || !this.world.getComponent(entity, PlayerControlled)) return;

    const moveX = input.axis('moveX');
    const moveY = input.axis('moveY');

    this.engine.camera.getWorldDirection(this.cameraForward);
    this.cameraForward.y = 0;

    if (this.cameraForward.lengthSq() > 0) {
      this.cameraForward.normalize();
    }

    this.cameraRight.crossVectors(this.cameraForward, this.up).normalize();

    this.moveDirection
      .addScaledVector(this.cameraForward, moveY)
      .addScaledVector(this.cameraRight, moveX);
  }

  private turnCharacter(
    controller: CharacterController,
    rigidbody: RAPIER.RigidBody,
    moveDirection: THREE.Vector3,
  ) {
    const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);

    const q = rigidbody.rotation();
    const currentQuat = new THREE.Quaternion(q.x, q.y, q.z, q.w);

    const euler = new THREE.Euler().setFromQuaternion(currentQuat, 'YXZ');
    const currentAngle = euler.y;

    // normalizing the difference (-PI..PI) to avoid taking the long way around
    let delta = targetAngle - currentAngle;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));

    const newAngle =
      Math.abs(delta) < 0.001
        ? targetAngle
        : currentAngle + delta * Math.min(1, controller.turnSpeed * this.engine.deltaTime);

    const newQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, newAngle, 0));

    rigidbody.setNextKinematicRotation(newQuat);
  }
}
