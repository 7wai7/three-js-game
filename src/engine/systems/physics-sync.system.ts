import RigidBody from "../components/rigidbody";
import System from "./system";

export default class PhysicsSyncSystem extends System {

    preRender(): void {
        const entities = this.world.entitiesWith(
            RigidBody,
        );

        for (const entity of entities) {
            const rigidbody = this.world.getComponent(
                entity,
                RigidBody,
            )!;

            const rb = rigidbody.rigidBody;

            const pos = rb.translation();
            const rot = rb.rotation();

            rigidbody.gameObject.position.set(
                pos.x,
                pos.y,
                pos.z,
            );

            rigidbody.gameObject.quaternion.set(
                rot.x,
                rot.y,
                rot.z,
                rot.w,
            );
        }
    }
}