import * as THREE from "three";
import GameScene from "./gameScene";
import RAPIER from "@dimforge/rapier3d";
import MeshComponent from "../ecs/components/mesh.component";
import PhysicsComponent from "../ecs/components/physics.component";
import TransformComponent from "../ecs/components/transform.component";
import AnimationComponent from "../ecs/components/animation.component";
import PlayerControllerComponent from "../ecs/components/playerController.component";

export default class CarScene extends GameScene {
  protected init() {
    this.background = new THREE.Color(0x202025);
    this.addLight();

    this.createPlayer();

    this.ecsService.createEntity(
      new TransformComponent(),
      new MeshComponent(
        new THREE.Mesh(
          new THREE.BoxGeometry(10, 0.2, 10),
          new THREE.MeshStandardMaterial({ color: 0x66ccff }),
        ),
      ),
      new PhysicsComponent(
        RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0),
        RAPIER.ColliderDesc.cuboid(5, 0.1, 5),
      ),
    );

    this.ecsService.createEntity(
      new TransformComponent(),
      new MeshComponent(
        new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0x66cc00 }),
        ),
      ),
      new PhysicsComponent(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(-2, 3, 0),
        RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.3),
      ),
    );
  }

  createPlayer() {
    const [_, components] = this.ecsService.createEntity(
      new TransformComponent(),

      new MeshComponent("src/assets/Cyberpunk-Car.glb"),

      new AnimationComponent(),
    );

    const meshComp = components[1];
    meshComp.onLoadMesh((mesh) => console.log(mesh))
  }

  addLight() {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.add(directionalLight);

    let spotLight = new THREE.SpotLight(
      0xffffff,
      20,
      50,
      Math.PI * 2,
      0.0001,
      1,
    );
    spotLight.position.set(2, 5, 0);
    this.add(spotLight);
  }
}
