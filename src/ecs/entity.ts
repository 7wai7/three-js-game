import type { EntityId } from "./ecs.types";

export class Entity {
    id: EntityId

    constructor(id: EntityId) {
        this.id = id
    }

    getComponent() {
        
    }
}