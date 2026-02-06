import "./style.css"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import initScene, { composer, animateScene } from "./scene/initScene.js"
import { monoBehaviourSystem } from "./ecs/systems/monoBehaviour.system.js";
import { ecsService } from "./ecs/ecs.service.js";
import TransformComponent from "./ecs/components/transform.component.js";
import MeshComponent from "./ecs/components/mesh.component.js";
import AnimationComponent from "./ecs/components/animation.component.js";

export let
  gltfLoader = new GLTFLoader();

(async function () {
  initScene()
  animate()

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
})()

function animate() {
  requestAnimationFrame(animate)

  monoBehaviourSystem.update();

  animateScene();

  composer.render()
}
