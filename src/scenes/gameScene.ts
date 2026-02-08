import * as THREE from "three";
import type Engine from "../engine/engine";
import type EcsService from "../ecs/ecs.service";

export default abstract class GameScene extends THREE.Scene {
  protected engine!: Engine;
  protected ecsService!: EcsService;

  onEnter(engine: Engine) {
    this.engine = engine;
    this.ecsService = engine.ecsService;
    this.init();
  }

  onExit() {
    this.dispose();
  }

  protected abstract init(): void;
  update(): void {}
  lateUpdate(): void {}

  dispose() {}
}
