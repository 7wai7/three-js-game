import "./style.css"
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import initScene, { composer, animateScene } from "./scene/initScene.js"
import { monoBehaviourSystem } from "./ecs/systems/monoBehaviour.system.js";
import { ecsService } from "./ecs/ecs.service.js";
import TransformComponent from "./ecs/components/transform.component.js";
import MeshComponent from "./ecs/components/mesh.component.js";
import AnimationComponent from "./ecs/components/animation.component.js";
import initPhysics, { physicsWorld } from "./physics/world.js";
import PhysicsComponent from "./ecs/components/physics.component.js";

export let
  gltfLoader = new GLTFLoader();

(async function () {
  initScene()
  initPhysics()
  animate()
  createPlayer()


  ecsService.createEntity(
    new TransformComponent(),
    new MeshComponent(
      new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x66ccff })
      )
    ),
    new PhysicsComponent(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0),
      RAPIER.ColliderDesc.cuboid(5, 0.1, 5)
    )
  )

  ecsService.createEntity(
    new TransformComponent(),
    new MeshComponent(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x66ccff })
      )
    ),
    new PhysicsComponent(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 3, 0),
      RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.3),
    )
  )
})()

function animate() {
  requestAnimationFrame(animate)

  monoBehaviourSystem.update();
  monoBehaviourSystem.postUpdate();
  physicsWorld.step();

  monoBehaviourSystem.preRender();
  animateScene();

  composer.render()
}


function createPlayer() {
  const [_, components] = ecsService.createEntity(
    new TransformComponent(),
    new MeshComponent("src/assets/Player/Mesh.glb"),
    new AnimationComponent()
  )

  const animationComp = components[2];
  animationComp.loadAnimation("Walk", "src/assets/Player/Animations/Walk.glb");
  animationComp.loadAnimation("FastRun", "src/assets/Player/Animations/Fast-Run.glb");
  animationComp.playAnimation("Walk");

  setTimeout(() => {
    animationComp.playAnimation("FastRun");
  }, 5000)
}