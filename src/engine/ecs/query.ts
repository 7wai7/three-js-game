import type { ComponentClass } from "./types";
import type World from "./world";

export default class Query {
    static entitiesWith(world: World, ...componentClasses: ComponentClass<any>[]) {
        return [...world.entites].filter(e =>
            componentClasses.every(c =>
                world.getComponent(e, c)
            )
        )
    }
}