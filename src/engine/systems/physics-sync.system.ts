import Object3D from "../components/object";
import RigidBody from "../components/rigidbody";
import System from "./system";

export default class PhysicsSyncSystem extends System {

    preRender(): void {
        const entities = this.world.entitiesWith(
            Object3D,
            RigidBody,
        );

        for (const entity of entities) {
            const object = this.world.getComponent(
                entity,
                Object3D,
            )!.object;

            const rb = this.world.getComponent(
                entity,
                RigidBody,
            )!.rigidBody;

            const pos = rb.translation();
            const rot = rb.rotation();

            object.position.set(
                pos.x,
                pos.y,
                pos.z,
            );

            object.quaternion.set(
                rot.x,
                rot.y,
                rot.z,
                rot.w,
            );
        }
    }
}