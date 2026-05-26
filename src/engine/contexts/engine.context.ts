import type Engine from "../engine";

export default class EngineContext {
  private static _engine: Engine;

  static setEngine(engine: Engine) {
    this._engine = engine;
  }

  static get engine(): Engine {
    if (!this._engine) {
      throw new Error("Engine is not initialized");
    }

    return this._engine;
  }
}