import EngineContext from '../contexts/engine.context';

export default abstract class System {
  started = false;

  start?(): void;

  update?(): void;

  postUpdate?(): void;

  preRender?(): void;

  render?(): void;

  protected get engine() {
    return EngineContext.engine;
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
