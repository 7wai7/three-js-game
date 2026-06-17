import * as THREE from "three";
import RigidBody from "../components/rigidbody";
import Car from "../components/vehicle/car";
import System from "./system";
import Wheel from "../components/vehicle/wheel";
import Object3D from "../components/object";
import Collider from "../components/collider";
import type RAPIER from "@dimforge/rapier3d";
import moveTowards from "../../utils/move-towards";

type Wheels = {
    wheel: Wheel;
    object: THREE.Object3D;
    steerMesh: THREE.Object3D;
    rigidbody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}

export default class CarControllerSystem extends System {
    private UP = new THREE.Vector3(0, 1, 0);
    private FORWARD = new THREE.Vector3(0, 0, 1);
    private RIGHT = new THREE.Vector3(1, 0, 0);

    private chassisQuat = new THREE.Quaternion();
    private chassisRight = new THREE.Vector3();
    private chassisUp = new THREE.Vector3();
    private chassisForward = new THREE.Vector3();

    update(): void {
        const entities = this.world.entitiesWith(
            Car,
            RigidBody,
        );

        for (const entity of entities) {
            const chassis = this.world.getComponent(entity, Car)!;
            const chassisObject = this.world.getComponent(entity, Object3D)!.object;
            const chassisCollider = this.world.getComponent(entity, Collider)!.collider;
            const rb = this.world.getComponent(entity, RigidBody)!.rigidBody;
            const wheels: Wheels[] = chassis.wheels.map(entity => ({
                wheel: this.world.getComponent(entity, Wheel)!,
                object: this.world.getComponent(entity, Object3D)!.object as THREE.Object3D,
                steerMesh: this.world.getComponent(entity, Wheel)!.steerMesh,
                rigidbody: this.world.getComponent(entity, RigidBody)!.rigidBody,
                collider: this.world.getComponent(entity, Collider)!.collider
            }));

            let hasGroundedWheel = false;
            for (const w of wheels) {
                this.checkIsGroundedWheel(
                    this.physicsWorld,
                    w.wheel,
                    w.collider,
                    [chassisCollider]
                );

                if (w.wheel.isGrounded) hasGroundedWheel = true;
            }

            for (const w of wheels) {
                this.applyInputSteering(
                    chassis,
                    w.wheel,
                    w.steerMesh
                )
            }

            if (hasGroundedWheel) {
                chassisObject.getWorldQuaternion(this.chassisQuat);
                this.chassisRight.copy(this.RIGHT).applyQuaternion(this.chassisQuat);
                this.chassisUp.copy(this.UP).applyQuaternion(this.chassisQuat);
                this.chassisForward.copy(this.FORWARD).applyQuaternion(this.chassisQuat);

                const throttle = chassis.inputMoveDir.z;

                for (const w of wheels) {
                    this.applyGroundPulling(
                        chassis,
                        rb,
                        w
                    )
                }

                if (!chassis.inputBrake || throttle !== 0) {
                    for (const w of wheels) {
                        this.applyThrottle(
                            chassis,
                            rb,
                            w
                        )
                    }
                }

                if (chassis.inputBrake) {
                    for (const w of wheels) {
                        this.applyWheelBrake(
                            chassis,
                            rb,
                            w
                        )
                    }
                }

                for (const w of wheels) {
                    this.applyWheelLateralGrip(
                        chassis,
                        rb,
                        w
                    )
                }
            }
        }
    }

    private checkIsGroundedWheel(
        physicsWorld: RAPIER.World,
        wheel: Wheel,
        collider: RAPIER.Collider,
        excludeColliders?: RAPIER.Collider[]
    ) {
        wheel.isGrounded = false;

        physicsWorld.contactPairsWith(
            collider,
            (otherCollider) => {
                if (
                    excludeColliders?.some(
                        c => c.handle === otherCollider.handle
                    )
                ) return;

                wheel.isGrounded = true;
            },
        );
    }

    private applyInputSteering(
        chassis: Car,
        wheel: Wheel,
        steerMesh: THREE.Object3D,
    ) {
        if (!wheel.maxSteerAngle) return;

        const steer = chassis.inputMoveDir.x;
        const targetAngle =
            wheel.maxSteerAngle *
            steer *
            (wheel.steerInverse ? 1 : -1);

        const steerSpeed =
            wheel.maxSteerAngle / 0.2;

        wheel.currentSteerAngle = moveTowards(
            wheel.currentSteerAngle,
            targetAngle,
            steerSpeed * this.dt,
        );

        const steerQuat = new THREE.Quaternion().setFromAxisAngle(
            this.UP,
            wheel.currentSteerAngle,
        );

        steerMesh.quaternion.copy(steerQuat);
    }

    private applyThrottle(
        chassis: Car,
        rb: RAPIER.RigidBody,
        wheel: Wheels,
    ) {
        if (!wheel.wheel.isGrounded || !wheel.wheel.isRear) return;

        const throttle = chassis.inputMoveDir.z;
        const wheelPos = wheel.rigidbody.translation();

        const forward = this.chassisForward.clone();
        forward.applyAxisAngle(
            this.chassisUp,
            wheel.wheel.currentSteerAngle,
        );

        const impulse = forward.clone().multiplyScalar(throttle * chassis.engineForce);

        rb.applyImpulseAtPoint(
            impulse,
            wheelPos,
            true,
        );
    }

    private applyWheelLateralGrip(
        chassis: Car,
        rb: RAPIER.RigidBody,
        wheel: Wheels,
    ) {
        if (!wheel.wheel.isGrounded) return;

        const wheelPos = wheel.rigidbody.translation();
        const pointVelocity = rb.velocityAtPoint(wheelPos);

        const side = this.chassisRight.clone();
        side.applyAxisAngle(
            this.chassisUp,
            wheel.wheel.currentSteerAngle,
        );

        const velocity = new THREE.Vector3(
            pointVelocity.x,
            pointVelocity.y,
            pointVelocity.z,
        );

        const up = this.chassisUp;

        const planarVelocity =
            velocity.clone().sub(
                up.clone().multiplyScalar(
                    velocity.dot(up),
                ),
            );

        const sideSpeed =
            planarVelocity.dot(side);

        const lateralImpulse =
            side.clone()
                .multiplyScalar(
                    -sideSpeed * chassis.sideGrip,
                );

        rb.applyImpulseAtPoint(
            lateralImpulse,
            wheelPos,
            true,
        );
    }

    private applyWheelBrake(
        chassis: Car,
        rb: RAPIER.RigidBody,
        wheel: Wheels,
    ) {
        if (!wheel.wheel.isGrounded) return;

        const wheelPos = wheel.rigidbody.translation();
        const pointVelocity = rb.velocityAtPoint(wheelPos);

        const forward = this.chassisForward.clone();

        forward.applyAxisAngle(
            this.chassisUp,
            wheel.wheel.currentSteerAngle,
        );

        const velocity = new THREE.Vector3(
            pointVelocity.x,
            pointVelocity.y,
            pointVelocity.z,
        );

        const up = this.chassisUp;

        const planarVelocity =
            velocity.clone().sub(
                up.clone().multiplyScalar(
                    velocity.dot(up),
                ),
            );

        const forwardSpeed =
            planarVelocity.dot(forward);

        const brakeImpulse =
            forward.clone()
                .multiplyScalar(
                    -forwardSpeed * chassis.brakeForce,
                );

        rb.applyImpulseAtPoint(
            brakeImpulse,
            wheelPos,
            true,
        );
    }

    private applyGroundPulling(
        car: Car,
        rb: RAPIER.RigidBody,
        wheel: Wheels
    ) {
        if (!wheel.wheel.isGrounded) return;

        const wheelPos = wheel.rigidbody.translation();
        const down = this.chassisUp.clone().negate();

        const pullImpulse =
            down.clone()
                .multiplyScalar(car.pullingForce);

        rb.applyImpulseAtPoint(
            pullImpulse,
            wheelPos,
            true,
        );

        /* 
         * or use wheel rigidbody
         */
        // wheel.rigidbody.applyImpulse(
        //     pullImpulse,
        //     true,
        // );
    }
}