import type Engine from "../engine/engine";
import type Component from "./components/component";
import type { EntityId } from "./ecs.types";
import { Entity } from "./entity";

export default class EcsService {
  private engine: Engine;
  private entities = new Map<EntityId, [Entity, Component[]]>();
  private nextEntityId: EntityId = 0;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  createEntity<T extends Component[]>(...components: T) {
    const id = this.nextEntityId++;
    const entity = new Entity(id);
    this.entities.set(id, [entity, components]);
    for (const component of components) {
      component.onInit({
        entityId: id,
        scene: this.engine.currentScene!,
        engine: this.engine,
        ecsService: this,
      });
    }
    return [entity, components] as [Entity, T];
  }

  addComponent<T extends Component>(entityId: EntityId, component: T) {
    const entry = this.entities.get(entityId);
    if (!entry) {
      throw new Error(`Entity with id ${entityId} does not exist`);
    }
    component.onInit({
      entityId,
      scene: this.engine.currentScene!,
      engine: this.engine,
      ecsService: this,
    });
    entry[1].push(component);
  }

  getComponent<T extends Component>(
    entityId: EntityId,
    componentClass: new (...args: any[]) => T,
  ): T | undefined {
    const entry = this.entities.get(entityId);
    if (!entry) {
      throw new Error(`Entity with id ${entityId} does not exist`);
    }
    return entry[1].find((comp) => comp instanceof componentClass) as
      | T
      | undefined;
  }
}
