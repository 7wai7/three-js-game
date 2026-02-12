import * as THREE from "three";
import { inputManager } from "../../imput/InputManager";
import MonoBehaviourComponent from "./monoBehaviour.component";
import PhysicsComponent from "./physics.component";
import AnimationComponent from "./animation.component";
import MeshComponent from "./mesh.component";
import RAPIER from "@dimforge/rapier3d";

export default class PlayerControllerComponent extends MonoBehaviourComponent {
  speed = 2;
  runSpeed = 6;

  private isRunning = false;
  private physicsComp!: PhysicsComponent;
  private animationComp!: AnimationComponent;
  private meshComp!: MeshComponent;
  private raycaster = new THREE.Raycaster();
  private aimTarget?: THREE.Vector3;

  init() {
    this.physicsComp = this.ecsService.getComponent(
      this.entityId,
      PhysicsComponent,
    )!;

    this.animationComp = this.ecsService.getComponent(
      this.entityId,
      AnimationComponent,
    )!;

    this.meshComp = this.ecsService.getComponent(this.entityId, MeshComponent)!;
  }

  update(): void {
    const v = inputManager.pressed("KeyW")
      ? 1
      : inputManager.pressed("KeyS")
        ? -1
        : 0;
    const h = inputManager.pressed("KeyD")
      ? 1
      : inputManager.pressed("KeyA")
        ? -1
        : 0;

    const moving = v !== 0 || h !== 0;

    this.solveAimByRaycast();
    if (this.aimTarget) this.aimSimple(this.aimTarget);

    if (inputManager.pressed("ShiftLeft") || inputManager.pressed("ShiftRight"))
      this.isRunning = true;
    else this.isRunning = false;

    if (moving) {
      this.move(v, h);

      if (this.isRunning) this.animationComp.playAnimation("FastRun");
      else this.animationComp.playAnimation("Walk");
    } else {
      this.animationComp.playAnimation("Idle");
    }
  }

  solveAimByRaycast() {
    const ndc = this.screenToNDC(
      inputManager.mousePosition,
      this.engine.renderer.domElement,
    );

    this.raycaster.setFromCamera(ndc, this.engine.camera);

    const ray = this.raycaster.ray;

    const r = new RAPIER.Ray(
      {
        x: ray.origin.x,
        y: ray.origin.y,
        z: ray.origin.z,
      },
      {
        x: ray.direction.x,
        y: ray.direction.y,
        z: ray.direction.z,
      },
    );

    // Ray → Rapier
    const hit = this.engine.physicsWorld.castRay(
      r,
      1000, // max distance
      true, // solid
    );

    if (hit) {
      this.aimTarget = ray.origin
        .clone()
        .add(ray.direction.clone().multiplyScalar(hit.timeOfImpact));
    } else this.aimTarget = undefined;
  }

  screenToNDC(mouse: { x: number; y: number }, dom: HTMLElement) {
    const rect = dom.getBoundingClientRect();

    return new THREE.Vector2(
      ((mouse.x - rect.left) / rect.width) * 2 - 1,
      -((mouse.y - rect.top) / rect.height) * 2 + 1,
    );
  }

  private aimSimple(target: THREE.Vector3, strength = 1) {
    if (!this.meshComp || !this.meshComp.mesh) return;

    const spine = this.meshComp.mesh.getObjectByName(
      "Spine1",
    ) as THREE.Bone;
    const head = this.meshComp.mesh.getObjectByName(
      "Head",
    ) as THREE.Bone;
    if (!spine || !head) return;

    // --- позиція голови у world ---
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);

    // --- напрямок до цілі у world ---
    const dirWorld = target.clone().sub(headPos).normalize();

    // --- обмеження yaw (щоб не дивився назад) ---

    // forward персонажа у world
    const characterWorldQuat = new THREE.Quaternion();
    this.meshComp.mesh.getWorldQuaternion(characterWorldQuat);

    const forwardWorld = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(characterWorldQuat)
      .setY(0)
      .normalize();

    // проєкція на XZ (ігноруємо pitch)
    forwardWorld.y = 0;
    forwardWorld.normalize();

    const dirXZ = dirWorld.clone();
    dirXZ.y = 0;
    dirXZ.normalize();

    // кут між forward і target (0..PI)
    const angle = Math.acos(
      THREE.MathUtils.clamp(forwardWorld.dot(dirXZ), -1, 1),
    );

    // максимальний кут
    const MAX_YAW = Math.PI / 1.7;

    const yawFactor = THREE.MathUtils.clamp(
      1 - (angle - Math.PI / 3) / MAX_YAW,
      0,
      1,
    );

    // застосувати до strength
    strength *= yawFactor;
    if (strength <= 0.0001) return;

    // --- перевести напрямок у LOCAL space голови ---
    const parentQuat = new THREE.Quaternion();
    head.parent!.getWorldQuaternion(parentQuat).invert();

    const dirLocal = dirWorld.clone().applyQuaternion(parentQuat).normalize();

    const forward = new THREE.Vector3(0, 0, 1);

    const targetQuatLocal = new THREE.Quaternion().setFromUnitVectors(
      forward,
      dirLocal,
    );

    // скільки даємо на spine (0..1)
    const spineWeight = 0.4;
    const headWeight = 1.0;

    // spine робить частину повороту
    const spineQuat = new THREE.Quaternion().slerpQuaternions(
      new THREE.Quaternion(), // identity
      targetQuatLocal,
      spineWeight,
    );

    spine.quaternion.slerp(spineQuat, strength);

    // --- тепер перерахувати target для голови відносно нового spine ---

    // world rotation голови після spine
    const headWorldQuat = new THREE.Quaternion();
    head.getWorldQuaternion(headWorldQuat);

    // знову порахувати напрямок у LOCAL голови
    const parentQuat2 = new THREE.Quaternion();
    head.parent!.getWorldQuaternion(parentQuat2).invert();

    const dirLocal2 = dirWorld.clone().applyQuaternion(parentQuat2).normalize();

    const headTargetLocal = new THREE.Quaternion().setFromUnitVectors(
      forward,
      dirLocal2,
    );

    // голова робить тільки залишок
    head.quaternion.slerp(headTargetLocal, strength * headWeight);
  }

  private move(v: number, h: number) {
    const rb = this.physicsComp.rb;
    const speed = this.isRunning ? this.runSpeed : this.speed;

    const forward = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3(-1, 0, 0);

    const dir = forward.multiplyScalar(v).add(right.multiplyScalar(h));
    if (dir.lengthSq() === 0) return;

    dir.normalize();

    this.rotate(dir);

    const move = dir.multiplyScalar(speed * this.engine.deltaTime);

    const pos = rb.translation();

    rb.setNextKinematicTranslation({
      x: pos.x + move.x,
      y: pos.y,
      z: pos.z + move.z,
    });
  }

  private rotate(dir: THREE.Vector3) {
    const rb = this.physicsComp.rb;

    // target yaw (куди дивитись)
    const targetYaw = Math.atan2(dir.x, dir.z);

    // поточний quaternion з Rapier
    const rot = rb.rotation();
    const currentQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    // отримуємо поточний yaw
    const euler = new THREE.Euler().setFromQuaternion(currentQuat, "YXZ");
    const currentYaw = euler.y;

    // нормалізуємо різницю (-PI..PI) щоб не крутився довгим шляхом
    let delta = targetYaw - currentYaw;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));

    // швидкість повороту (рад/сек)
    const turnSpeed = 10; // підбери (6-15 норм)

    // новий yaw
    const newYaw =
      Math.abs(delta) < 0.001
        ? targetYaw
        : currentYaw + delta * Math.min(1, turnSpeed * this.engine.deltaTime);

    // новий quaternion
    const newQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, newYaw, 0),
    );

    // застосувати до Rapier
    rb.setNextKinematicRotation({
      x: newQuat.x,
      y: newQuat.y,
      z: newQuat.z,
      w: newQuat.w,
    });
  }
}
