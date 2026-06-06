import * as THREE from "three";
import RigidBodyComponent from "../components/rigidbody";
import CarComponent from "../components/vehicle/car";
import Query from "../ecs/query";
import System from "./system";
import WheelComponent from "../components/vehicle/wheel";
import Object3DComponent from "../components/object";
import ColliderComponent from "../components/collider";
import type RAPIER from "@dimforge/rapier3d";

type WheelComponents = {
    wheel: WheelComponent;
    object: THREE.Object3D;
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
        const entities = Query.entitiesWith(this.world,
            CarComponent,
            RigidBodyComponent,
        );

        for (const entity of entities) {
            const chassis = this.world.getComponent(entity, CarComponent)!;
            const chassisObject = this.world.getComponent(entity, Object3DComponent)!.object;
            const chassisCollider = this.world.getComponent(entity, ColliderComponent)!.collider;
            const rb = this.world.getComponent(entity, RigidBodyComponent)!.rigidBody;
            const wheels: WheelComponents[] = chassis.wheels.map(entity => ({
                wheel: this.world.getComponent(entity, WheelComponent)!,
                object: this.world.getComponent(entity, Object3DComponent)!.object as THREE.Object3D,
                rigidbody: this.world.getComponent(entity, RigidBodyComponent)!.rigidBody,
                collider: this.world.getComponent(entity, ColliderComponent)!.collider
            }));

            for (const w of wheels) {
                this.checkIsGroundedWheel(
                    this.physicsWorld,
                    w.wheel,
                    w.collider,
                    [chassisCollider]
                )
            }

            if (wheels.some(w => w.wheel.isGrounded)) {
                const position = rb.translation();
                const rotation = rb.rotation();
                const throttle = chassis.inputMoveDir.z;
                const steer = chassis.inputMoveDir.x;
                const vel = rb.linvel();
                const horizontalVelocity = new THREE.Vector3(
                    vel.x,
                    0,
                    vel.z,
                );

                const speed = horizontalVelocity.length();


                chassisObject.getWorldQuaternion(this.chassisQuat);
                this.chassisRight.copy(this.RIGHT).applyQuaternion(this.chassisQuat);
                this.chassisUp.copy(this.UP).applyQuaternion(this.chassisQuat);
                this.chassisForward.copy(this.FORWARD).applyQuaternion(this.chassisQuat);

                if (throttle !== 0 || chassis.inputBrake) this.calculateCarWheelsCenter(chassis, wheels);

                for (const w of wheels) {
                    this.applyGroundPulling(
                        chassis,
                        rb,
                        w
                    )
                }

                for (const w of wheels) {
                    this.applyThrottle(
                        chassis,
                        rb,
                        w
                    )
                }

                if (chassis.inputBrake) {
                    const horizontalVelocity = new THREE.Vector3(
                        vel.x,
                        0,
                        vel.z,
                    );

                    const speed = horizontalVelocity.length();

                    if (speed > 0.01) {
                        const brakeDirection =
                            horizontalVelocity
                                .normalize()
                                .negate();

                        rb.applyImpulseAtPoint(
                            {
                                x: brakeDirection.x * chassis.brakeForce,
                                y: 0,
                                z: brakeDirection.z * chassis.brakeForce,
                            },
                            chassis.wheelsCenter,
                            true,
                        );
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
        wheel: WheelComponent,
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

    private calculateCarWheelsCenter(car: CarComponent, wheels: WheelComponents[]) {
        car.rearCenter.set(0, 0, 0);
        car.wheelsCenter.set(0, 0, 0);
        let groundedWheels = 0;
        let rearWheels = 0;

        for (const w of wheels) {
            if (w.wheel.isGrounded) {
                groundedWheels++;
                const v = new THREE.Vector3();
                w.object.getWorldPosition(v);
                car.wheelsCenter.add(v);
                if (w.wheel.isRear) {
                    rearWheels++;
                    car.rearCenter.add(v);
                }
            }
        }

        if (rearWheels > 0) car.rearCenter.divideScalar(rearWheels);
        if (groundedWheels > 0) car.wheelsCenter.divideScalar(groundedWheels);
    }

    private applyThrottle(
        chassis: CarComponent,
        rb: RAPIER.RigidBody,
        wheel: WheelComponents,
    ) {
        const throttle = chassis.inputMoveDir.z;
        if (!wheel.wheel.isGrounded || !wheel.wheel.isRear || chassis.inputBrake || throttle === 0) return;

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
        chassis: CarComponent,
        rb: RAPIER.RigidBody,
        wheel: WheelComponents,
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
            0,
            pointVelocity.z,
        );

        const sideSpeed =
            velocity.dot(side);

        const lateralImpulse =
            side.clone()
                .multiplyScalar(
                    -sideSpeed * chassis.sideGrip,
                );

        rb.applyImpulseAtPoint(
            {
                x: lateralImpulse.x,
                y: 0,
                z: lateralImpulse.z,
            },
            wheelPos,
            true,
        );
    }

    private applyGroundPulling(
        car: CarComponent,
        rb: RAPIER.RigidBody,
        wheel: WheelComponents
    ) {
        if (!wheel.wheel.isGrounded) return;

        const wheelPos = wheel.rigidbody.translation();
        const down = this.chassisUp.clone().negate();

        const pullImpulse =
            down.clone()
                .multiplyScalar(car.pullingGrip);

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