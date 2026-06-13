import EngineContext from "../contexts/engine.context";
import type { EntityId } from "./types";

export default abstract class Component {
  entity!: EntityId;
  
  protected get engine() {
    return EngineContext.engine;
  }

  protected get input() {
    return this.engine.input;
  }

  protected get assets() {
    return this.engine.assets;
  }

  protected get scene() {
    return this.engine.scene;
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
}