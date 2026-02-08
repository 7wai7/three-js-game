import type Engine from "../engine/engine";
import type Component from "./components/component";
import type { EntityId } from "./ecs.types";

export default class EcsService {
  private engine: Engine;
  private entities = new Map<EntityId, Component[]>();
  private nextEntityId: EntityId = 0;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  createEntity<T extends Component[]>(...components: T) {
    const id = this.nextEntityId++;
    this.entities.set(id, components);
    for (const component of components) {
      component.onInit({
        entityId: id,
        scene: this.engine.currentScene!,
        engine: this.engine,
        ecsService: this,
      });
    }
    return [id, components] as [EntityId, T];
  }

  destroyEntity(entityId: EntityId) {
    const components = this.entities.get(entityId);
    if (!components) return;

    for (let i = components.length - 1; i >= 0; i--) {
      components[i].onDestroy?.();
    }

    this.entities.delete(entityId);
  }

  addComponent<T extends Component>(entityId: EntityId, component: T) {
    const components = this.entities.get(entityId);
    if (!components) {
      throw new Error(`Entity with id ${entityId} does not exist`);
    }
    component.onInit({
      entityId,
      scene: this.engine.currentScene!,
      engine: this.engine,
      ecsService: this,
    });
    components.push(component);
  }

  getComponent<T extends Component>(
    entityId: EntityId,
    componentClass: new (...args: any[]) => T,
  ): T | undefined {
    const components = this.entities.get(entityId);
    if (!components) {
      throw new Error(`Entity with id ${entityId} does not exist`);
    }
    return components.find((comp) => comp instanceof componentClass) as
      | T
      | undefined;
  }

  clear() {
    // destroy у зворотному порядку
    for (const [_, components] of this.entities) {
      for (let i = components.length - 1; i >= 0; i--) {
        const c = components[i];
        try {
          c.onDestroy?.();
        } catch (e) {
          console.error("Component destroy error:", c, e);
        }
      }
    }

    this.entities.clear();
    this.nextEntityId = 0;
  }
}
