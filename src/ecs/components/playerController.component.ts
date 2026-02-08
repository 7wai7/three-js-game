import * as THREE from "three";
import { inputManager } from "../../imput/InputManager";
import MonoBehaviourComponent from "./monoBehaviour.component";
import PhysicsComponent from "./physics.component";
import AnimationComponent from "./animation.component";

export default class PlayerControllerComponent extends MonoBehaviourComponent {
    speed = 2;
    runSpeed = 6;

    private isRunning = false;
    private physicsComp!: PhysicsComponent;
    private animationComp!: AnimationComponent;

    init() {
        super.init();

        this.physicsComp = this.ecsService.getComponent(
            this.entityId,
            PhysicsComponent,
        )!;

        this.animationComp = this.ecsService.getComponent(
            this.entityId,
            AnimationComponent,
        )!;
    }

    update(): void {
        const v =
            inputManager.pressed("KeyW") ? 1 : inputManager.pressed("KeyS") ? -1 : 0;
        const h =
            inputManager.pressed("KeyD") ? 1 : inputManager.pressed("KeyA") ? -1 : 0;

        const moving = v !== 0 || h !== 0;

        if (inputManager.pressed("ShiftLeft") || inputManager.pressed("ShiftRight")) this.isRunning = true;
        else this.isRunning = false;

        if (moving) {
            this.move(v, h);

            if (this.isRunning) this.animationComp.playAnimation("FastRun");
            else this.animationComp.playAnimation("Walk");
        } else {
            this.animationComp.playAnimation("Idle");
        }
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
