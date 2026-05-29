import type System from "../systems/system";
import Component from "./component";
import type { ComponentClass, EntityId, SystemClass } from "./types";

export default class World {
    readonly entites: Set<EntityId> = new Set();
    readonly components: Map<ComponentClass<any>, Map<EntityId, Component>> = new Map();
    readonly systems: Map<SystemClass<any>, System> = new Map();

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

    removeComponent<T extends Component>(entity: EntityId, componentClass: ComponentClass<T>) {
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

    addSystem<T extends System>(system: T) {
        const systemClass = system.constructor as SystemClass<T>;
        this.systems.set(systemClass, system);
    }

    getSystem<T extends System>(systemClass: SystemClass<T>) {
        return this.systems.get(systemClass) as T;
    }

    update() {
        for (const system of this.systems.values()) {
            if (system.started) {
                system.update?.();
            } else {
                system.start?.();
                system.started = true;
            }
        }

        for (const system of this.systems.values()) {
            system.postUpdate?.();
        }

        for (const system of this.systems.values()) {
            system.preRender?.();
        }

        for (const system of this.systems.values()) {
            system.render?.();
        }
    }
}