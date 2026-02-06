import type Component from "./components/component";
import type { EntityId } from "./ecs.types"
import { Entity } from "./entity";

class EcsService {
    private entities = new Map<EntityId, [Entity, Component[]]>();
    private nextEntityId: EntityId = 0;

    createEntity<T extends Component[]>(...components: T) {
        const id = this.nextEntityId++
        const entity = new Entity(id);
        this.entities.set(id, [entity, components])
        for (const component of components) {
            component.entityId = id;
            component._init();
        }
        return [entity, components] as [Entity, T];
    }

    addComponent<T extends Component>(entityId: EntityId, component: T) {
        const entry = this.entities.get(entityId)
        if (!entry) {
            throw new Error(`Entity with id ${entityId} does not exist`)
        }
        component.entityId = entityId;
        component._init();
        entry[1].push(component)
    }

    getComponent<T extends Component>(entityId: EntityId, componentClass: new (...args: any[]) => T): T | undefined {
        const entry = this.entities.get(entityId)
        if (!entry) {
            throw new Error(`Entity with id ${entityId} does not exist`)
        }
        return entry[1].find(comp => comp instanceof componentClass) as T | undefined
    }
}

export const ecsService = new EcsService()