import EcsService from "./../ecs.service";
import type { EntityId } from "../ecs.types";
import type Engine from "../../engine/engine";
import type GameScene from "../../scenes/gameScene";

export default abstract class Component {
  readonly id: string = crypto.randomUUID();

  protected entityId!: EntityId;
  protected scene!: GameScene;
  protected engine!: Engine;
  protected ecsService!: EcsService;

  private inited = false;

  onInit({
    entityId,
    scene,
    engine,
    ecsService,
  }: {
    entityId: EntityId;
    scene: GameScene;
    engine: Engine;
    ecsService: EcsService;
  }) {
    this.entityId = entityId;
    this.scene = scene;
    this.engine = engine;
    this.ecsService = ecsService;
    if (!this.inited) this.init();
  }

  protected init(): void {}
}
