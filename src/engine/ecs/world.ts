import type System from "../systems/system";
import Component from "./component";
import type { ComponentClass, EntityId, QueryCache, SystemClass } from "./types";

export default class World {
    readonly entites: Set<EntityId> = new Set();
    readonly components: Map<ComponentClass<any>, Map<EntityId, Component>> = new Map();
    readonly queryCache = new Map<
        string,
        QueryCache
    >();
    readonly systems: Map<SystemClass<any>, System> = new Map();

    private nextEntityId = 0;

    createEntity() {
        const n = this.nextEntityId++;
        this.entites.add(n);
        return n;
    }

    destroyEntity(id: EntityId) {
        this.entites.delete(id);

        for (const componentMap of this.components.values()) {
            componentMap.delete(id);
        }

        for (const query of this.queryCache.values()) {
            query.entities.delete(id);
        }
    }

    addComponent<T extends Component>(entity: EntityId, component: T) {
        const componentClass = component.constructor as ComponentClass<T>;
        if (!this.components.get(componentClass)) {
            this.components.set(componentClass, new Map());
        }
        this.components.get(componentClass)!.set(entity, component);

        for (const query of this.queryCache.values()) {
            const match =
                Array.from(query.components).every(
                    c => !!this.getComponent(entity, c),
                );

            if (match) {
                query.entities.add(entity);
            }
        }

        return component;
    }

    removeComponent<T extends Component>(entity: EntityId, componentClass: ComponentClass<T>) {
        const componentMap = this.components.get(componentClass);
        if (!componentMap) {
            return;
        }

        const component = componentMap.get(entity);
        componentMap.delete(entity);

        for (const query of this.queryCache.values()) {
            if (
                query.components.includes(componentClass)
            ) {
                query.entities.delete(entity);
            }
        }

        return component as T | undefined;
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


    // QUERIES
    entitiesWith(...componentClasses: ComponentClass<any>[]) {
        const key = this.createQueryKey(componentClasses);

        let query = this.queryCache.get(key);

        if (!query) {
            const entities = [...this.entites].filter(e =>
                componentClasses.every(c =>
                    this.getComponent(e, c)
                )
            )

            query = {
                components: componentClasses,
                entities: new Set(entities)
            }

            this.queryCache.set(
                key,
                query,
            );
        }

        return query.entities;
    }

    private createQueryKey(componentClasses: ComponentClass<any>[]) {
        return componentClasses.map(c => c.name).sort().join("-");
    }


    // UPDATE SYSTEMS
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