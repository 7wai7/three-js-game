import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import GLTFAssetManager from './assets/gltf-asset-manager';
import PhysicsSyncSystem from './systems/physics-sync.system';
import InputManager from './input/input-manager';
import CharacterControllerSystem from './systems/character-controller.system';
import CameraControllerSystem from './systems/camera-controller.system';
import AnimationsSystem from './systems/animations.system';
import type { Assets } from './assets/types';
import TextureAssetManager from './assets/texture-asset-manager';
import RapierDebugRenderer from './systems/rapier-debug-renderer.system';
import CarControllerSystem from './systems/car-controller.system';
import GameWorld from './game/game-world';
import InputLayer from './input/input-layer';
import { defaultGameplayInput } from './input/input-configs/default-gameplay-input';
import PlayerInputSystem from './systems/input-controllers/player-input.system';
import { defaultCameraInput } from './input/input-configs/default-camera-input';
import { systemInput } from './input/input-configs/system-input';

export default class Engine {
  readonly world: GameWorld = new GameWorld();
  readonly input: InputManager = new InputManager();
  readonly inputLayers = new Map<string, InputLayer>([
    ['system', new InputLayer(this.input, systemInput)],
    ['camera', new InputLayer(this.input, defaultCameraInput)],
    ['gameplay', new InputLayer(this.input, defaultGameplayInput)],
  ]);

  readonly assets: Assets = {
    gltf: new GLTFAssetManager(),
    textures: new TextureAssetManager(),
  };

  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene<THREE.Object3DEventMap>;
  readonly camera: THREE.Camera;

  private readonly clock = new THREE.Clock();
  private readonly gravity = { x: 0, y: -9.81, z: 0 };

  readonly physicsWorld = new RAPIER.World(this.gravity);

  deltaTime = 0;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.world.addSystem(new PhysicsSyncSystem());
    this.world.addSystem(new PlayerInputSystem());
    this.world.addSystem(new CarControllerSystem());
    this.world.addSystem(new CharacterControllerSystem());
    this.world.addSystem(new AnimationsSystem());
    this.world.addSystem(new CameraControllerSystem());
    this.world.addSystem(new RapierDebugRenderer());
  }

  getInputLayer(name: string) {
    return this.inputLayers.get(name);
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
    this.world.flushDisposedComponents();
    this.input.endFrame();
  };
}
