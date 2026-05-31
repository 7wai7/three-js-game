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
import getObjectSize from "../../utils/get-object-size";

export async function createPlayer(
  world: World,
  physicsWorld: RAPIER.World,
  scene: THREE.Scene,
  assets: GLTFAssetManager
) {
  const entity = world.createEntity();

  // Load the player model
  const gltf = await assets.loadModel("src/assets/Player/Mesh.glb");
  const mesh = gltf.scene;

  const radius = 0.22;
  const totalHeight = getObjectSize(mesh).y;
  const halfHeight = (totalHeight - radius * 2) / 2;

  const rootMesh = new THREE.Object3D();
  mesh.position.y = -(totalHeight / 2);
  rootMesh.add(mesh);

  const uniformScale = getUniformScale(rootMesh, totalHeight);
  mesh.scale.setScalar(uniformScale);

  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(rootMesh);


  // Load animations
  const mixer = new THREE.AnimationMixer(rootMesh);
  world.addComponent(entity, new AnimationComponent(mixer));
  const animSystem = world.getSystem(AnimationsSystem);
  Promise.all([
    animSystem.loadAnimation(entity, "Idle", "src/assets/Player/Animations/Standing-Idle.glb"),
    animSystem.loadAnimation(entity, "Walk", "src/assets/Player/Animations/Walk.glb"),
    animSystem.loadAnimation(entity, "Run", "src/assets/Player/Animations/Fast-Run.glb"),
    animSystem.loadAnimation(entity, "Jumping Up", "src/assets/Player/Animations/Jumping Up.glb"),
    animSystem.loadAnimation(entity, "Jumping Down", "src/assets/Player/Animations/Jumping Down.glb"),
    animSystem.loadAnimation(entity, "Fall", "src/assets/Player/Animations/Falling Idle.glb"),
  ])


  // Create the character controller
  const controller = physicsWorld.createCharacterController(0.01);

  // Configure step climbing
  controller.setMaxSlopeClimbAngle(Math.PI / 4); // 45 degrees
  controller.setMinSlopeSlideAngle(Math.PI / 3); // 60 degrees

  const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, totalHeight, 0);
  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius).setRestitution(0.3);
  const rb = physicsWorld.createRigidBody(rbDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rb);

  // Add components to the world
  world.addComponent(entity, new Object3DComponent(rootMesh));
  world.addComponent(entity, new RigidBodyComponent(rb));
  world.addComponent(entity, new ColliderComponent(collider));
  world.addComponent(entity, new PlayerControllerComponent(controller));
  world.addComponent(entity, new PlayerInputComponent());

  return entity;
}