import * as THREE from "three";
import type GameScene from "../scenes/gameScene";
import EcsService from "../ecs/ecs.service";
import MonoBehaviourSystem from "../ecs/systems/monoBehaviour.system";
import RAPIER from "@dimforge/rapier3d";
import { inputManager } from "../imput/InputManager";

export default class Engine {
  ecsService: EcsService;
  renderer: THREE.WebGLRenderer;
  currentScene?: GameScene;
  clock = new THREE.Clock();

  gravity = { x: 0, y: -9.81, z: 0 };
  physicsWorld = new RAPIER.World(this.gravity);
  deltaTime = 0;

  readonly monoBehaviourSystem = new MonoBehaviourSystem();

  constructor(
    renderer: THREE.WebGLRenderer,
  ) {
    this.renderer = renderer;
    this.ecsService = new EcsService(this);
  }

  start(scene: GameScene) {
    this.setScene(scene);
    this.loop();
  }

  setScene(scene: GameScene) {
    if (this.currentScene) {
      this.currentScene.onExit();
      this.monoBehaviourSystem.dispose();
      this.ecsService.clear();
      this.physicsWorld = new RAPIER.World(this.gravity);
      this.clearThreeScene(this.currentScene);
    }

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

    this.monoBehaviourSystem.preRender();

    this.currentScene?.render(this.renderer);

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
