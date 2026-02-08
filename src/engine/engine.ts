import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import type GameScene from "../scenes/gameScene";
import type { RenderPasses } from "./engine.types";
import EcsService from "../ecs/ecs.service";
import MonoBehaviourSystem from "../ecs/systems/monoBehaviour.system";
import RAPIER from "@dimforge/rapier3d";
import { inputManager } from "../imput/InputManager";

export default class Engine {
  ecsService: EcsService;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  composer: EffectComposer;
  currentScene?: GameScene;
  passes: RenderPasses;
  clock = new THREE.Clock();
  controls?: OrbitControls;

  gravity = { x: 0, y: -9.81, z: 0 };
  physicsWorld = new RAPIER.World(this.gravity);
  deltaTime = 0;

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

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.target.set(0, 1, 0);
    // this.camera.position.z = 20;
    // this.camera.position.y = 2;
    // this.controls.update();
  }

  setScene(scene: GameScene) {
    if (this.currentScene) {
      this.currentScene.onExit();
      this.monoBehaviourSystem.dispose();
      this.ecsService.clear();
      this.physicsWorld = new RAPIER.World(this.gravity);
      this.clearThreeScene(this.currentScene);
    }

    // Передаємо сцену в RenderPass
    this.passes.pixelPass.scene = scene;

    this.currentScene = scene;
    scene.onEnter(this);
  }

  private loop = () => {
    requestAnimationFrame(this.loop);

    const dt = this.clock.getDelta();
    this.deltaTime = dt;

    this.physicsWorld.step();
    this.monoBehaviourSystem.update();
    this.monoBehaviourSystem.postUpdate();
    this.currentScene?.update();
    this.currentScene?.lateUpdate();
    this.controls?.update();

    this.monoBehaviourSystem.preRender();
    this.composer.render();

    inputManager.postUpdate();
  };

  private clearThreeScene(scene: THREE.Scene) {
    scene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: any) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }

      if (obj.texture) obj.texture.dispose();
    });

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }
}
