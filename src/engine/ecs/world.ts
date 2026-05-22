import type System from "../systems/system";
import Component from "./component";
import type { ComponentClass, EntityId } from "./types";

export default class World {
    readonly entites: Set<EntityId> = new Set();
    readonly components: Map<ComponentClass<any>, Map<EntityId, Component>> = new Map();

    readonly systems: System[] = [];

    private nextEntityId = 0;

    createEntity() {
        const n = this.nextEntityId++;
        this.entites.add(n);
        return n;
    }

    destroyEntity(id: EntityId) {
        for (const c of this.components.values()) {
            c.delete(id)
        }
    }

    addComponent<T extends Component>(entity: EntityId, component: T) {
        const componentClass = component.constructor as ComponentClass<T>;
        if (!this.components.get(componentClass)) {
            this.components.set(componentClass, new Map());
        }
        this.components.get(componentClass)!.set(entity, component);
        return component;
    }

    removeComponent(entity: EntityId, componentClass: ComponentClass<any>) {
        const componentMap = this.components.get(componentClass);
        if (componentMap) {
            const component = componentMap.get(entity);
            componentMap.delete(entity);
            if (component) return component;
        }
    }

    getComponent<T extends Component>(entity: EntityId, componentClass: ComponentClass<T>) {
        const componentMap = this.components.get(componentClass);
        if (componentMap) {
            return componentMap.get(entity) as T;
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    update(dt: number) {
        for (const system of this.systems) {
            system.update?.();
        }

        for (const system of this.systems) {
            system.postUpdate?.();
        }

        for (const system of this.systems) {
            system.preRender?.();
        }

        for (const system of this.systems) {
            system.render?.();
        }
    }
}
