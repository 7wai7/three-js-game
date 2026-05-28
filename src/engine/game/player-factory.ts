import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import Object3DComponent from "../components/object";
import type World from "../ecs/world";
import RigidBodyComponent from "../components/rigidbody";
import PlayerControllerComponent from "../components/player-controller";
import ColliderComponent from "../components/collider";
import EngineContext from "../contexts/engine.context";
import getUniformScale from "../../utils/get-uniform-scale";

export async function createPlayer(world: World, physicsWorld: RAPIER.World, scene: THREE.Scene) {
  const entity = world.createEntity();

  const radius = 0.5;
  const totalHeight = 1.8;
  const halfHeight = (totalHeight - radius * 2) / 2;

  // Load the player model
  const mesh = await EngineContext.engine.assets.loadModel("src/assets/Player/Mesh.glb");
  const uniformScale = getUniformScale(mesh, totalHeight);
  mesh.scale.setScalar(uniformScale);

  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(mesh);


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

  return entity;
}