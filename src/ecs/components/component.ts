import type { EntityId } from "../ecs.types";

export default abstract class Component {
    id: string = crypto.randomUUID();
    entityId!: EntityId;

    private inited = false;

    _init() {
        if (!this.inited) this.init()
    };

    async init() { }
}