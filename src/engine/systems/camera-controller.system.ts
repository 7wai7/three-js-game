import * as THREE from "three";
import { clamp, DEG2RAD } from "three/src/math/MathUtils.js";
import System from "./system";
import Object3D from "../components/object";

export default class CameraControllerSystem extends System {
    followEntity?: string;

    mouseSensitivity = 0.01;
    lookAtOffset = new THREE.Vector3(0, 0, 0);

    // internal state
    dist = 10;
    minDist = 2;
    maxDist = 10;
    zoomStep = 0.3;

    yawOffset = 0;
    pitchOffset = -20 * DEG2RAD;

    // rotation smoothing speed
    rotationSmoothness = 10;

    private readonly upAxis = new THREE.Vector3(0, 1, 0);
    private readonly rightAxis = new THREE.Vector3(1, 0, 0);

    private readonly targetPosition = new THREE.Vector3();
    private readonly targetLookPosition = new THREE.Vector3();

    private readonly desiredCameraPosition = new THREE.Vector3();

    private readonly localOffset = new THREE.Vector3();
    private readonly worldOffset = new THREE.Vector3();

    private readonly targetQuat = new THREE.Quaternion();
    private readonly currentQuat = new THREE.Quaternion();

    private readonly yawQuat = new THREE.Quaternion();
    private readonly pitchQuat = new THREE.Quaternion();

    start(): void {
        this.yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yawOffset);
        this.pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitchOffset);
        this.updateOffset();
    }

    update(): void {
        this.handleInput();
    }

    postUpdate(): void {
        this.follow();
    }

    addYaw(delta: number) {
        this.yawOffset += delta;
    }

    addPitch(delta: number) {
        this.pitchOffset += delta;
        const limit = (Math.PI / 2) * 0.99;

        this.pitchOffset = clamp(
            this.pitchOffset,
            -limit,
            limit,
        );
    }

    private updateOffset() {
        this.localOffset.set(0, 0, this.dist);
    }

    private handleInput() {
        if (this.input.isMouseDown(0)) {
            const maxDelta = 70;
            const dx = clamp(this.input.mouseDelta.x, -maxDelta, maxDelta);
            const dy = clamp(this.input.mouseDelta.y, -maxDelta, maxDelta);

            this.addYaw(-dx * this.mouseSensitivity);
            this.addPitch(-dy * this.mouseSensitivity);
        }

        if (this.input.wheelDelta !== 0) {
            this.dist += Math.sign(this.input.wheelDelta) * this.zoomStep;
            this.dist = clamp(this.dist, this.minDist, this.maxDist);
            this.updateOffset();
        }
    }

    private follow() {
        const camera = this.engine.camera;

        if (typeof this.followEntity === "string") {
            const target = this.world.getComponent(
                this.followEntity!,
                Object3D,
            )?.object as THREE.Object3D;

            if (!target) {
                console.warn("Camera target not found");
            } else {
                target.getWorldPosition(this.targetPosition);
            }
        }

        this.yawQuat.setFromAxisAngle(this.upAxis, this.yawOffset);
        this.pitchQuat.setFromAxisAngle(this.rightAxis, this.pitchOffset);

        this.targetQuat
            .copy(this.yawQuat)
            .multiply(this.pitchQuat);


        const t = 1 - Math.exp(-this.rotationSmoothness * this.dt);
        const slerpT = clamp(t, 0, 1);

        this.currentQuat.slerp(
            this.targetQuat,
            slerpT
        );

        this.worldOffset
            .copy(this.localOffset)
            .applyQuaternion(this.currentQuat);


        this.desiredCameraPosition
            .copy(this.targetPosition)
            .add(this.worldOffset);

        camera.position.copy(this.desiredCameraPosition);

        // look target
        this.targetLookPosition
            .copy(this.targetPosition)
            .add(this.lookAtOffset);

        camera.lookAt(this.targetLookPosition);
    }
}