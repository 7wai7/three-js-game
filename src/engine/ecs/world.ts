import type System from '../systems/system';
import Component from './component';
import { isDisposableComponent, type DisposableComponent } from './component-disposal';
import { ComponentRequirementError, getRequiredComponents } from './require-component';
import type {
  ComponentClass,
  ComponentInstances,
  EntityId,
  QueryCache,
  QueryResult,
  SystemClass,
} from './types';

export default class World {
  readonly entities: Set<EntityId> = new Set();
  readonly components: Map<ComponentClass<any>, Map<EntityId, Component>> = new Map();
  readonly queryCache = new Map<string, QueryCache>();
  readonly systems: Map<SystemClass<any>, System> = new Map();

  private readonly disposeQueue: DisposableComponent[] = [];
  private readonly queuedForDispose = new Set<DisposableComponent>();
  private componentRequirementsDirty = false;

  createEntity(id: EntityId) {
    if (this.entities.has(id)) {
      throw new Error(`Entity '${id}' already exists`);
    }

    this.entities.add(id);

    return id;
  }

  destroyEntity(id: EntityId) {
    this.entities.delete(id);

    for (const componentMap of this.components.values()) {
      const component = componentMap.get(id);

      if (component) {
        this.queueComponentDispose(component);
      }

      componentMap.delete(id);
    }

    for (const query of this.queryCache.values()) {
      query.entities.delete(id);
    }

    this.markComponentRequirementsDirty();
  }

  addComponent<T extends Component>(entity: EntityId, component: T) {
    if (!this.entities.has(entity)) throw new Error(`Entity '${entity}' not found`);

    const componentClass = component.constructor as ComponentClass<T>;

    let componentMap = this.components.get(componentClass);

    if (!componentMap) {
      componentMap = new Map();
      this.components.set(componentClass, componentMap);
    }

    const previousComponent = componentMap.get(entity);

    if (previousComponent) {
      console.warn(
        `Component "${componentClass.name}" is already attached to entity "${entity}" and will be replaced`,
      );
    }

    if (previousComponent && previousComponent !== component) {
      this.queueComponentDispose(previousComponent);
    }

    componentMap.set(entity, component);
    component.entity = entity;
    this.cancelComponentDispose(component);

    this.markQueriesDirty();
    this.markComponentRequirementsDirty();

    return component;
  }

  removeComponent<T extends Component>(entity: EntityId, componentClass: ComponentClass<T>) {
    const componentMap = this.components.get(componentClass);
    if (!componentMap) {
      return;
    }

    const component = componentMap.get(entity);
    componentMap.delete(entity);

    if (component) {
      this.queueComponentDispose(component);
    }

    this.markQueriesDirty();
    this.markComponentRequirementsDirty();

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
  query<T extends readonly ComponentClass<Component>[]>(...componentClasses: T): QueryResult<T>[] {
    const entities = this.entitiesWith(...componentClasses);
    const result: QueryResult<T>[] = [];

    for (const entity of entities) {
      const components = componentClasses.map((componentClass) =>
        this.getComponent(entity, componentClass),
      ) as unknown as ComponentInstances<T>;

      result.push([entity, ...components] as QueryResult<T>);
    }

    return result;
  }

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
        const matches = query.components.every((c) => this.getComponent(entity, c));

        if (matches) {
          query.entities.add(entity);
        }
      }

      query.dirty = false;
    }

    return query.entities;
  }

  getComponentsFromEntities<T extends readonly ComponentClass<Component>[]>(
    entities: EntityId[],
    ...componentClasses: T
  ): ComponentInstances<T> {
    const result: Component[] = [];

    for (const componentClass of componentClasses) {
      const componentMap = this.components.get(componentClass);

      if (!componentMap) {
        throw new Error(`Component "${componentClass.name}" not found in provided entities`);
      }

      let foundComponent: Component | undefined;

      for (const entity of entities) {
        const component = componentMap.get(entity);

        if (component) {
          foundComponent = component;
          break;
        }
      }

      if (!foundComponent) {
        throw new Error(`Component "${componentClass.name}" not found in provided entities`);
      }

      result.push(foundComponent);
    }

    return result as ComponentInstances<T>;
  }

  // UTILS
  private markQueriesDirty() {
    for (const query of this.queryCache.values()) {
      query.dirty = true;
    }
  }

  private markComponentRequirementsDirty() {
    this.componentRequirementsDirty = true;
  }

  validateComponentRequirements() {
    for (const [componentClass, componentMap] of this.components) {
      for (const entity of componentMap.keys()) {
        this.assertComponentRequirements(entity, componentClass);
      }
    }

    this.componentRequirementsDirty = false;
  }

  private assertComponentRequirements(entity: EntityId, componentClass: ComponentClass<Component>) {
    const missingComponents = getRequiredComponents(componentClass).filter((requiredComponent) => {
      if (requiredComponent === componentClass) {
        return false;
      }

      return !this.getComponent(entity, requiredComponent);
    });

    if (missingComponents.length > 0) {
      throw new ComponentRequirementError(entity, componentClass, missingComponents);
    }
  }

  private queueComponentDispose(component: Component) {
    if (!isDisposableComponent(component)) {
      return;
    }

    if (this.queuedForDispose.has(component)) {
      return;
    }

    this.queuedForDispose.add(component);
    this.disposeQueue.push(component);
  }

  private cancelComponentDispose(component: Component) {
    if (isDisposableComponent(component)) {
      this.queuedForDispose.delete(component);
    }
  }

  flushDisposedComponents() {
    for (const component of this.disposeQueue) {
      if (!this.queuedForDispose.delete(component)) {
        continue;
      }

      try {
        component.dispose();
      } catch (error) {
        console.error(`Failed to dispose component "${component.constructor.name}"`, error);
      }
    }

    this.disposeQueue.length = 0;
    this.queuedForDispose.clear();
  }

  private createQueryKey(componentClasses: ComponentClass<any>[]) {
    return componentClasses
      .map((c) => c.name)
      .sort()
      .join('|');
  }

  // UPDATE SYSTEMS
  update() {
    if (this.componentRequirementsDirty) {
      this.validateComponentRequirements();
    }

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
