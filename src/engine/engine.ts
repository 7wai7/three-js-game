import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import AssetManager from "./game/asset-manager";
import World from "./ecs/world";
import MeshSystem from "./systems/mesh.system";
import InputSystem from "./systems/input.system";
import RenderSystem from "./systems/render.sustem";

export default class Engine {
  readonly world: World = new World();
  readonly assets: AssetManager = new AssetManager();

  readonly clock = new THREE.Clock();
  readonly gravity = { x: 0, y: -9.81, z: 0 };

  physicsWorld = new RAPIER.World(this.gravity);
  deltaTime = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.world.addSystem(new InputSystem());
    this.world.addSystem(new MeshSystem());
    this.world.addSystem(new RenderSystem(renderer, scene, camera));
  }

  start() {
    this.loop();
  }

  private loop = () => {
    requestAnimationFrame(this.loop);

    const dt = this.clock.getDelta();
    this.deltaTime = dt;

    this.physicsWorld.step();

    this.world.update(dt);
  };
}
