import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import System from "./system";

export default class PhysicsSyncSystem extends System {

    preRender(): void {
        const entities = this.world.entitiesWith(
            Object3DComponent,
            RigidBodyComponent,
        );

        for (const entity of entities) {
            const object = this.world.getComponent(
                entity,
                Object3DComponent,
            )!.object;

            const rb = this.world.getComponent(
                entity,
                RigidBodyComponent,
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