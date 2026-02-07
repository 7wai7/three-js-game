import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import type GameScene from "../scenes/gameScene";
import type { RenderPasses } from "./engine.types";
import EcsService from "../ecs/ecs.service";
import MonoBehaviourSystem from "../ecs/systems/monoBehaviour.system";

export default class Engine {
  ecsService: EcsService;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  composer: EffectComposer;
  currentScene?: GameScene;
  passes: RenderPasses;
  clock = new THREE.Clock();
  controls?: OrbitControls;

  readonly monoBehaviourSystem = new MonoBehaviourSystem();

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    composer: EffectComposer,
    passes: RenderPasses,
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.composer = composer;
    this.passes = passes;
    this.ecsService = new EcsService(this);
  }

  start(scene: GameScene) {
    this.setScene(scene);
    this.loop();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.camera.position.z = 2;
    this.camera.position.y = 2 * Math.tan(Math.PI / 6);
    this.controls.update();
  }

  setScene(scene: GameScene) {
    if (this.currentScene) this.currentScene.onExit();

    // Передаємо сцену в RenderPass
    this.passes.pixelPass.scene = scene;

    this.currentScene = scene;
    scene.onEnter(this);
  }

  private loop = () => {
    requestAnimationFrame(this.loop);

    const dt = this.clock.getDelta();

    this.monoBehaviourSystem.update();
    this.monoBehaviourSystem.postUpdate();
    this.currentScene?.update(dt);
    this.currentScene?.lateUpdate(dt);
    this.controls?.update();

    this.monoBehaviourSystem.preRender();
    this.composer.render();
  };
}
