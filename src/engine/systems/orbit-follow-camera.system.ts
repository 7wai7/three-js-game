import * as THREE from 'three';
import Camera from '../components/camera';
import OrbitFollowCamera from '../components/camera-controls/orbit-follow-camera';
import System from './system';

export default class OrbitFollowCameraSystem extends System {
  private readonly upAxis = new THREE.Vector3(0, 1, 0);
  private readonly rightAxis = new THREE.Vector3(1, 0, 0);

  private readonly targetLookPosition = new THREE.Vector3();
  private readonly desiredCameraPosition = new THREE.Vector3();
  private readonly localOffset = new THREE.Vector3();
  private readonly worldOffset = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly yawRotation = new THREE.Quaternion();
  private readonly pitchRotation = new THREE.Quaternion();

  update(): void {
    if (!this.engine.mode.isPlayMode) return;

    const input = this.engine.getInputLayer('camera');
    if (!input) return;

    for (const [, camera, follow] of this.world.query(Camera, OrbitFollowCamera)) {
      if (camera.camera !== this.engine.camera) continue;

      if (input.pressed('cameraRotate')) {
        const maxDelta = 70;
        const dx = THREE.MathUtils.clamp(input.axis('lookX'), -maxDelta, maxDelta);
        const dy = THREE.MathUtils.clamp(input.axis('lookY'), -maxDelta, maxDelta);

        follow.yaw -= dx * follow.mouseSensitivity;
        follow.pitch -= dy * follow.mouseSensitivity;
        this.clampPitch(follow);
      }

      const zoom = input.axis('zoom');

      if (zoom !== 0) {
        follow.distance += Math.sign(zoom) * follow.zoomStep;
        follow.distance = THREE.MathUtils.clamp(
          follow.distance,
          follow.minDistance,
          follow.maxDistance,
        );
      }
    }
  }

  postUpdate(): void {
    if (!this.engine.mode.isPlayMode) return;

    for (const [, camera, follow] of this.world.query(Camera, OrbitFollowCamera)) {
      if (camera.camera !== this.engine.camera) continue;

      this.follow(camera.camera, follow);
    }
  }

  private follow(camera: THREE.Camera, follow: OrbitFollowCamera) {
    if (follow.targetEntity) {
      const target = this.world.gameObjects.get(follow.targetEntity);

      if (target) {
        target.getWorldPosition(follow.targetPosition);
      } else {
        console.warn(`Camera target not found for entity "${follow.targetEntity}"`);
      }
    }

    this.yawRotation.setFromAxisAngle(this.upAxis, follow.yaw);
    this.pitchRotation.setFromAxisAngle(this.rightAxis, follow.pitch);
    this.targetRotation.copy(this.yawRotation).multiply(this.pitchRotation);

    if (!follow.hasCurrentRotation) {
      follow.currentRotation.copy(this.targetRotation);
      follow.hasCurrentRotation = true;
    } else {
      const t =
        follow.rotationSmoothness > 0 ? 1 - Math.exp(-follow.rotationSmoothness * this.dt) : 1;

      follow.currentRotation.slerp(this.targetRotation, THREE.MathUtils.clamp(t, 0, 1));
    }

    this.localOffset.set(0, 0, follow.distance);
    this.worldOffset.copy(this.localOffset).applyQuaternion(follow.currentRotation);
    this.desiredCameraPosition.copy(follow.targetPosition).add(this.worldOffset);

    camera.position.copy(this.desiredCameraPosition);

    this.targetLookPosition.copy(follow.targetPosition).add(follow.lookAtOffset);
    camera.lookAt(this.targetLookPosition);
  }

  private clampPitch(follow: OrbitFollowCamera) {
    const limit = (Math.PI / 2) * 0.99;
    follow.pitch = THREE.MathUtils.clamp(follow.pitch, -limit, limit);
  }
}
