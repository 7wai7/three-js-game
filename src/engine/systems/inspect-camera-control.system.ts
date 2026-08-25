import * as THREE from 'three';
import Camera from '../components/camera';
import InspectCameraControl from '../components/camera-controls/inspect-camera-control';
import type InputLayer from '../input/input-layer';
import System from './system';

export default class InspectCameraControlSystem extends System {
  private readonly cameraForward = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly moveDirection = new THREE.Vector3();
  private readonly rotation = new THREE.Euler(0, 0, 0, 'YXZ');

  start(): void {
    this.engine.renderer.domElement.addEventListener('mousedown', this.requestPointerLock);
  }

  update(): void {
    const isInspectMode = this.engine.mode.isInspectMode;
    const input = this.engine.getInputLayer('inspect');
    const isPointerLocked = this.engine.input.isPointerLocked;

    if (!isInspectMode && isPointerLocked) {
      this.engine.input.exitPointerLock();
    }

    for (const [, camera, control] of this.world.query(Camera, InspectCameraControl)) {
      if (camera.camera !== this.engine.camera) continue;

      if (!isInspectMode) {
        control.wasActive = false;
        continue;
      }

      if (!control.wasActive) {
        this.captureCameraRotation(camera.camera, control);
        control.wasActive = true;
      }

      if (isPointerLocked && this.engine.input.clicked('Escape')) {
        this.engine.input.exitPointerLock();
      }

      if (input) {
        this.handleInput(camera.camera, control, input, isPointerLocked);
      }
    }
  }

  private handleInput(
    camera: THREE.Camera,
    control: InspectCameraControl,
    input: InputLayer,
    isPointerLocked: boolean,
  ) {
    if (!isPointerLocked) {
      return;
    }

    const maxDelta = 70;
    const dx = THREE.MathUtils.clamp(input.axis('lookX'), -maxDelta, maxDelta);
    const dy = THREE.MathUtils.clamp(input.axis('lookY'), -maxDelta, maxDelta);

    control.yaw -= dx * control.lookSensitivity;
    control.pitch -= dy * control.lookSensitivity;
    this.clampPitch(control);

    this.applyCameraRotation(camera, control);
    this.moveCamera(camera, control, input);
  }

  private moveCamera(camera: THREE.Camera, control: InspectCameraControl, input: InputLayer) {
    this.moveDirection.set(0, 0, 0);

    const moveX = input.axis('moveX');
    const moveY = input.axis('moveY');
    const moveZ = input.axis('cameraMoveY');

    if (moveX === 0 && moveY === 0 && moveZ === 0) {
      return;
    }

    camera.getWorldDirection(this.cameraForward).normalize();
    this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    this.resolveVerticalAxis(camera, control);

    this.moveDirection
      .addScaledVector(this.cameraForward, moveY)
      .addScaledVector(this.cameraRight, moveX)
      .addScaledVector(this.cameraUp, moveZ);

    this.moveDirection.normalize();

    const speed =
      control.moveSpeed * (input.pressed('boost') ? control.fastMoveMultiplier : 1) * this.dt;

    camera.position.addScaledVector(this.moveDirection, speed);
  }

  private captureCameraRotation(camera: THREE.Camera, control: InspectCameraControl) {
    this.rotation.setFromQuaternion(camera.quaternion, 'YXZ');
    control.pitch = this.rotation.x;
    control.yaw = this.rotation.y;
    this.clampPitch(control);
  }

  private applyCameraRotation(camera: THREE.Camera, control: InspectCameraControl) {
    this.rotation.set(control.pitch, control.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(this.rotation);
  }

  private requestPointerLock = (event: MouseEvent) => {
    if (!this.engine.mode.isInspectMode) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    this.engine.input.requestPointerLock();
  };

  private clampPitch(control: InspectCameraControl) {
    const limit = (Math.PI / 2) * 0.99;
    control.pitch = THREE.MathUtils.clamp(control.pitch, -limit, limit);
  }

  private resolveVerticalAxis(camera: THREE.Camera, control: InspectCameraControl) {
    this.cameraUp.set(0, 1, 0);

    if (!control.useWorldVerticalAxis) {
      this.cameraUp.applyQuaternion(camera.quaternion).normalize();
    }
  }
}
