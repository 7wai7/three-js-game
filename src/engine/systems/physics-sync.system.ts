import MeshComponent from "../components/mesh";
import RigidBodyComponent from "../components/rigidbody";
import Query from "../ecs/query";
import type World from "../ecs/world";
import System from "./system";

export default class PhysicsSyncSystem extends System {

    preRender(world: World): void {

        const entities = Query.entitiesWith(
            world,
            MeshComponent,
            RigidBodyComponent,
        );

        for (const entity of entities) {

            const mesh = world.getComponent(
                entity,
                MeshComponent,
            )!.mesh;

            const rb = world.getComponent(
                entity,
                RigidBodyComponent,
            )!.rigidBody;

            const pos = rb.translation();
            const rot = rb.rotation();

            mesh.position.set(
                pos.x,
                pos.y,
                pos.z,
            );

            mesh.quaternion.set(
                rot.x,
                rot.y,
                rot.z,
                rot.w,
            );
        }
    }
}