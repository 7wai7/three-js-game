import * as THREE from "three";
import RigidBodyComponent from "../components/rigidbody";
import CarComponent from "../components/vehicle/car";
import Query from "../ecs/query";
import System from "./system";
import WheelComponent from "../components/vehicle/wheel";
import Object3DComponent from "../components/object";
import ColliderComponent from "../components/collider";
import type RAPIER from "@dimforge/rapier3d";

export default class CarControllerSystem extends System {
    update(): void {
        const entities = Query.entitiesWith(this.world,
            CarComponent,
            RigidBodyComponent,
        );

        for (const entity of entities) {
            const car = this.world.getComponent(entity, CarComponent)!;
            const carCollider = this.world.getComponent(entity, ColliderComponent)!.collider;
            const rb = this.world.getComponent(entity, RigidBodyComponent)!.rigidBody;
            const wheels = car.wheels.map(entity => ({
                component: this.world.getComponent(entity, WheelComponent)!,
                object: this.world.getComponent(entity, Object3DComponent)!.object as THREE.Object3D,
                collider: this.world.getComponent(entity, ColliderComponent)!.collider
            }));

            for (const w of wheels) {
                this.checkIsGroundedWheel(
                    this.physicsWorld,
                    w.component,
                    w.collider,
                    [carCollider]
                )
            }

            const groundedWheels = [...wheels].filter(w => w.component.isRear && w.component.isGrounded);


            if (groundedWheels.length > 0) {
                const position = rb.translation();
                const rotation = rb.rotation();

                const forward = new THREE.Vector3(0, 0, 1)
                    .applyQuaternion(
                        new THREE.Quaternion(
                            rotation.x,
                            rotation.y,
                            rotation.z,
                            rotation.w,
                        ),
                    )
                    .normalize();

                const throttle = car.inputMoveDir.z;

                if (throttle !== 0 && !car.inputBrake) {
                    car.rearCenter.set(0, 0, 0);

                    for (const w of groundedWheels) {
                        const v = new THREE.Vector3();
                        w.object.getWorldPosition(v);
                        car.rearCenter.add(v);
                    }

                    car.rearCenter.divideScalar(groundedWheels.length);

                    rb.applyImpulseAtPoint(
                        {
                            x: forward.x * throttle * car.engineForce,
                            y: 0,
                            z: forward.z * throttle * car.engineForce,
                        },
                        car.rearCenter,
                        true,
                    );
                }


                const steer = car.inputMoveDir.x;


                const vel = rb.linvel();


                const speed =
                    Math.sqrt(
                        vel.x * vel.x +
                        vel.z * vel.z,
                    );

                if (speed > car.maxSpeed) {
                    const scale = car.maxSpeed / speed;

                    rb.setLinvel(
                        {
                            x: vel.x * scale,
                            y: vel.y,
                            z: vel.z * scale,
                        },
                        true,
                    );
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
}