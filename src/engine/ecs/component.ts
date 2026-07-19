import EngineContext from "../contexts/engine.context";
import type { EntityId } from "./types";

export default abstract class Component {
  entity!: EntityId;

  private get engine() {
    return EngineContext.engine;
  }

  protected get physicsWorld() {
    return this.engine.physicsWorld;
  }

  protected get world() {
    return this.engine.world;
  }

  protected get dt() {
    return this.engine.deltaTime;
  }

  get gameObject() {
    return this.world.getGameObject(this.entity);
  }
}
