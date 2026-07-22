import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import RigidBody from '../components/rigidbody';
import CharacterController from '../components/character-controller';
import Collider from '../components/collider';
import getUniformScale from '../../utils/get-uniform-scale';
import Animation from '../components/animation';
import AnimationsSystem from '../systems/animations.system';
import { getObjectSizeBox3 } from '../../utils/get-object-size';
import { GROUP_PLAYER, GROUP_WORLD, interactionGroups } from './physics-groups';
import type Engine from '../engine';
import { resolveSpawnTransform, type SpawnTransform } from '../../utils/spawn-transform';

export async function createPlayer(engine: Engine, transform: SpawnTransform = {}) {
  const { world, physicsWorld, scene, assets } = engine;
  const { position, rotation } = resolveSpawnTransform(transform);

  // Load the player model
  const gltf = await assets.gltf.loadModel('src/assets/Player/Mesh.glb');
  const mesh = gltf.scene;

  const radius = 0.22;
  const totalHeight = getObjectSizeBox3(mesh).y;
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

  const entity = world.createGameObject(rootMesh);

  // Load animations
  const mixer = new THREE.AnimationMixer(rootMesh);
  world.addComponent(entity, new Animation(mixer));
  const animSystem = world.getSystem(AnimationsSystem);
  Promise.all([
    animSystem.loadAnimation(entity, 'Idle', 'src/assets/Player/Animations/Standing-Idle.glb'),
    animSystem.loadAnimation(entity, 'Walk', 'src/assets/Player/Animations/Walk.glb'),
    animSystem.loadAnimation(entity, 'Run', 'src/assets/Player/Animations/Fast-Run.glb'),
    animSystem.loadAnimation(entity, 'Jumping Up', 'src/assets/Player/Animations/Jumping Up.glb'),
    animSystem.loadAnimation(
      entity,
      'Jumping Down',
      'src/assets/Player/Animations/Jumping Down.glb',
    ),
    animSystem.loadAnimation(entity, 'Fall', 'src/assets/Player/Animations/Falling Idle.glb'),
  ]);

  // Create the character controller
  const controller = physicsWorld.createCharacterController(0.01);

  // Configure step climbing
  controller.setMaxSlopeClimbAngle(Math.PI / 4); // 45 degrees
  controller.setMinSlopeSlideAngle(Math.PI / 3); // 60 degrees

  const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    .setTranslation(position.x, position.y + totalHeight / 2, position.z)
    .setRotation(rotation);

  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
    .setCollisionGroups(interactionGroups(GROUP_PLAYER, GROUP_WORLD))
    .setRestitution(0.3);
  const rb = physicsWorld.createRigidBody(rbDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rb);

  // Add components to the world
  world.addComponent(entity, new RigidBody(rb));
  world.addComponent(entity, new Collider(collider));
  world.addComponent(
    entity,
    new CharacterController(controller, {
      colliderHalfHeight: totalHeight / 2,
    }),
  );

  return entity;
}
