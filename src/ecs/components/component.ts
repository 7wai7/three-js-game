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

  onInit(ctx: {
    entityId: EntityId;
    scene: GameScene;
    engine: Engine;
    ecsService: EcsService;
  }) {
    if (this.inited) return;

    this.entityId = ctx.entityId;
    this.scene = ctx.scene;
    this.engine = ctx.engine;
    this.ecsService = ctx.ecsService;

    this.__internalInit(); // lifecycle систем
    this.init(); // ← hook для нащадків

    this.inited = true;
  }

  // системний lifecycle (override ЗАБОРОНЕНО)
  protected __internalInit(): void {}

  // user hook
  protected init(): void {}

  onDestroy(): void {}
}
