import CharacterController from '../../components/character-controller';
import System from '../system';
import PlayerController from '../../components/player-controller';
import * as THREE from 'three';

export default class CharacterInputSystem extends System {
  private cameraForward = new THREE.Vector3();
  private cameraRight = new THREE.Vector3();

  update(): void {
    const entities = this.world.entitiesWith(CharacterController, PlayerController);

    const entity = entities.keys().next().value;
    if (!entity) return;

    const camera = this.engine.camera;

    const controller = this.world.getComponent(entity, CharacterController)!;

    const forward = this.input.vertical();
    const right = this.input.horizontal();

    // camera forward
    camera.getWorldDirection(this.cameraForward);

    // flatten
    this.cameraForward.y = 0;
    this.cameraForward.normalize();

    // right vector
    this.cameraRight.crossVectors(this.cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

    controller.inputMoveDir
      .set(0, 0, 0)
      .addScaledVector(this.cameraForward, forward)
      .addScaledVector(this.cameraRight, right);

    controller.isRunning = this.input.pressed('ShiftLeft') || this.input.pressed('ShiftRight');

    if (this.input.clicked('Space')) controller.jumpRequested = true;
  }
}
