import type System from "../systems/system";
import Component from "./component";
import type { ComponentClass, EntityId, QueryCache, SystemClass } from "./types";

export default class World {
    readonly entities: Set<EntityId> = new Set();
    readonly components: Map<ComponentClass<any>, Map<EntityId, Component>> = new Map();
    readonly queryCache = new Map<
        string,
        QueryCache
    >();
    readonly systems: Map<SystemClass<any>, System> = new Map();

    createEntity(id: EntityId) {
        if (this.entities.has(id)) {
            throw new Error(
                `Entity '${id}' already exists`,
            );
        }

        this.entities.add(id);

        return id;
    }

    destroyEntity(id: EntityId) {
        this.entities.delete(id);

        for (const componentMap of this.components.values()) {
            componentMap.delete(id);
        }

        for (const query of this.queryCache.values()) {
            query.entities.delete(id);
        }
    }

    addComponent<T extends Component>(entity: EntityId, component: T) {
        if (!this.entities.has(entity)) throw new Error(`Entity '${entity}' not found`);
        
        const componentClass = component.constructor as ComponentClass<T>;
        let componentMap =
            this.components.get(componentClass);

        if (!componentMap) {
            componentMap = new Map();
            this.components.set(
                componentClass,
                componentMap,
            );
        }

        componentMap.set(entity, component);
        component.entity = entity;

        this.markQueriesDirty();

        return component;
    }

    removeComponent<T extends Component>(entity: EntityId, componentClass: ComponentClass<T>) {
        const componentMap = this.components.get(componentClass);
        if (!componentMap) {
            return;
        }

        const component = componentMap.get(entity);
        componentMap.delete(entity);

        this.markQueriesDirty();

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
            const entities = new Set<EntityId>();

            query = {
                components: [...componentClasses],
                entities,
                dirty: true,
            };

            this.queryCache.set(key, query);
        }

        if (query.dirty) {
            query.entities.clear();

            for (const entity of this.entities) {
                const matches =
                    query.components.every(
                        c => this.getComponent(entity, c),
                    );

                if (matches) {
                    query.entities.add(entity);
                }
            }

            query.dirty = false;
        }

        return query.entities;
    }

    getComponentsFromEntities<
        T extends readonly ComponentClass<Component>[]
    >(
        entities: Iterable<EntityId>,
        ...componentClasses: T
    ): InstanceType<T[number]>[] {
        const result: InstanceType<T[number]>[] = [];

        for (const componentClass of componentClasses) {
            const componentMap = this.components.get(componentClass);

            if (!componentMap) {
                continue;
            }

            for (const entity of entities) {
                const component = componentMap.get(entity);

                if (component) {
                    result.push(
                        component as InstanceType<T[number]>,
                    );
                }
            }
        }

        return result;
    }

    // UTILS
    private markQueriesDirty() {
        for (const query of this.queryCache.values()) {
            query.dirty = true;
        }
    }

    private createQueryKey(componentClasses: ComponentClass<any>[]) {
        return componentClasses.map(c => c.name).sort().join("|");
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