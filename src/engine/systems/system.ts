import type World from "../ecs/world";

export default abstract class System {
  update?(world: World, dt: number): void;

  postUpdate?(world: World, dt: number): void;

  preRender?(world: World, dt: number): void;

  render?(world: World, dt: number): void;
}