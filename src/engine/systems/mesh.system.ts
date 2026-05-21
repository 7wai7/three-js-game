import MeshComponent from "../components/mesh";
import TransformComponent from "../components/transform";
import Query from "../ecs/query";
import type World from "../ecs/world";
import System from "./system";

export default class MeshSystem extends System {
    preRender(world: World): void {
        const entities = Query.entitiesWith(world, TransformComponent, MeshComponent);
        for (const entity of entities) {
            const transform = world.getComponent(entity, TransformComponent)!;
            const meshComp = world.getComponent(entity, MeshComponent)!;
            const mesh = meshComp.mesh;

            if (!mesh) return;
            mesh.position.set(
                transform.position.x,
                transform.position.y,
                transform.position.z,
            );
            mesh.rotation.set(
                transform.rotation.x,
                transform.rotation.y,
                transform.rotation.z,
            );
            mesh.scale.set(
                transform.scale.x,
                transform.scale.y,
                transform.scale.z,
            );
        }
    }
}