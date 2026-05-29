import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import Object3DComponent from "../components/object";
import type World from "../ecs/world";
import RigidBodyComponent from "../components/rigidbody";
import PlayerControllerComponent from "../components/player-controller";
import ColliderComponent from "../components/collider";
import getUniformScale from "../../utils/get-uniform-scale";
import AnimationComponent from "../components/animation";
import AnimationsSystem from "../systems/animations.system";
import type GLTFAssetManager from "../assets/gltf-asset-manager";
import PlayerInputComponent from "../components/player-input";

export async function createPlayer(
  world: World,
  physicsWorld: RAPIER.World,
  scene: THREE.Scene,
  assets: GLTFAssetManager
) {
  const entity = world.createEntity();

  const radius = 0.5;
  const totalHeight = 1.8;
  const halfHeight = (totalHeight - radius * 2) / 2;

  // Load the player model
  const gltf = await assets.loadModel("src/assets/Player/Mesh.glb");
  const mesh = gltf.scene;
  const uniformScale = getUniformScale(mesh, totalHeight);
  mesh.scale.setScalar(uniformScale);

  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(mesh);


  // Load animations
  const mixer = new THREE.AnimationMixer(mesh);
  world.addComponent(entity, new AnimationComponent(mixer));
  const animSystem = world.getSystem(AnimationsSystem);
  Promise.all([
    animSystem.loadAnimation(entity, "Idle", "src/assets/Player/Animations/Standing-Idle.glb"),
    animSystem.loadAnimation(entity, "Walk", "src/assets/Player/Animations/Walk.glb"),
    animSystem.loadAnimation(entity, "FastRun", "src/assets/Player/Animations/Fast-Run.glb"),
  ]).then(() => {
    animSystem.playAnimation(entity, "Idle");
  })


  // Create the character controller
  const controller = physicsWorld.createCharacterController(0.01);

  // Configure step climbing
  controller.setMaxSlopeClimbAngle(Math.PI / 4); // 45 degrees
  controller.setMinSlopeSlideAngle(Math.PI / 3); // 60 degrees

  const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, totalHeight, 0);
  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight / 2, radius).setRestitution(0.3);
  const rb = physicsWorld.createRigidBody(rbDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rb);

  // Add components to the world
  world.addComponent(entity, new Object3DComponent(mesh));
  world.addComponent(entity, new RigidBodyComponent(rb));
  world.addComponent(entity, new ColliderComponent(collider));
  world.addComponent(entity, new PlayerControllerComponent(controller));
  world.addComponent(entity, new PlayerInputComponent());

  return entity;
}