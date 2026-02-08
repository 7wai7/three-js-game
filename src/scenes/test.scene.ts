import * as THREE from "three";
import GameScene from "./gameScene";
import RAPIER from "@dimforge/rapier3d";
import MeshComponent from "../ecs/components/mesh.component";
import PhysicsComponent from "../ecs/components/physics.component";
import TransformComponent from "../ecs/components/transform.component";
import AnimationComponent from "../ecs/components/animation.component";
import PlayerControllerComponent from "../ecs/components/playerController.component";

export default class TestScene extends GameScene {
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
    const PLAYER_HEIGHT = 1.8;
    const PLAYER_RADIUS = 0.3;
    const HALF_HEIGHT = (PLAYER_HEIGHT - PLAYER_RADIUS * 2) / 2;

    const [_, components] = this.ecsService.createEntity(
      new TransformComponent(),

      new MeshComponent("src/assets/Player/Mesh.glb"),

      new AnimationComponent(),

      new PhysicsComponent(
        RAPIER.RigidBodyDesc.kinematicPositionBased()
          .setTranslation(0, PLAYER_HEIGHT / 2, 0)
          .enabledRotations(true, true, true),

        RAPIER.ColliderDesc.capsule(HALF_HEIGHT, PLAYER_RADIUS)
          .setFriction(0)
          .setRestitution(0),
      ),

      new PlayerControllerComponent(),
    );

    components[1].visualOffset.y = -PLAYER_HEIGHT / 2

    const animationComp = components[2];
    animationComp.loadAnimation(
      "Idle",
      "src/assets/Player/Animations/Standing-Idle.glb",
    );
    animationComp.loadAnimation(
      "Walk",
      "src/assets/Player/Animations/Walk.glb",
    );
    animationComp.loadAnimation(
      "FastRun",
      "src/assets/Player/Animations/Fast-Run.glb",
    );
  }

  addLight() {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.add(directionalLight);
  }
}
