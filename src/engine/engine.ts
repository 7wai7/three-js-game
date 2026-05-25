import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import AssetManager from "./game/asset-manager";
import World from "./ecs/world";
import PhysicsSyncSystem from "./systems/physics-sync.system";
import InputManager from "./input-manager";
import PlayerControllerSystem from "./systems/player-controller.system";

export default class Engine {
  readonly world: World = new World();
  readonly input: InputManager = new InputManager();
  readonly assets: AssetManager = new AssetManager();

  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene<THREE.Object3DEventMap>;
  readonly camera: THREE.Camera;

  private readonly clock = new THREE.Clock();
  private readonly gravity = { x: 0, y: -9.81, z: 0 };

  readonly physicsWorld = new RAPIER.World(this.gravity);

  deltaTime = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.world.addSystem(new PhysicsSyncSystem());
    this.world.addSystem(new PlayerControllerSystem());
  }

  start() {
    this.loop();
  }

  private loop = () => {
    requestAnimationFrame(this.loop);

    this.deltaTime = this.clock.getDelta();

    this.input.beginFrame();
    this.physicsWorld.step();
    this.world.update();
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  };
}
