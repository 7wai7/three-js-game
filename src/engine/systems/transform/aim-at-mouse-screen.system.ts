import * as THREE from 'three';
import { Ray } from '@dimforge/rapier3d/geometry/ray';
import AimAtMouseScreen from '../../components/transform/aim-at-mouse-screen';
import AimAtTarget from '../../components/transform/aim-at-target';
import System from '../system';

export default class AimAtMouseScreenSystem extends System {
  private readonly mouseNdc = new THREE.Vector2();
  private readonly raycaster = new THREE.Raycaster();
  private readonly hitPoint = new THREE.Vector3();

  update(): void {
    for (const [entity, mouseGround] of this.world.query(AimAtMouseScreen)) {
      if (!mouseGround.enabled) {
        continue;
      }

      const aim = this.world.getComponent(entity, AimAtTarget);
      if (!aim) {
        continue;
      }

      if (this.castMouseGroundRay(mouseGround, this.hitPoint)) {
        if (!aim.targetPosition) {
          aim.targetPosition = new THREE.Vector3();
        }

        aim.targetPosition.copy(this.hitPoint);
        aim.targetObject = undefined;
      }
    }
  }

  private castMouseGroundRay(mouseGround: AimAtMouseScreen, target: THREE.Vector3) {
    this.updateMouseNdc();
    this.raycaster.setFromCamera(this.mouseNdc, this.engine.camera);

    const { origin, direction } = this.raycaster.ray;
    const ray = new Ray(origin, direction);

    const hit = this.physicsWorld.castRay(
      ray,
      mouseGround.maxDistance,
      mouseGround.solid,
      undefined,
      mouseGround.filterGroups,
    );

    if (!hit) {
      return false;
    }

    target.copy(origin).addScaledVector(direction, hit.timeOfImpact);
    return true;
  }

  private updateMouseNdc() {
    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    const mouse = this.engine.input.mousePosition;

    this.mouseNdc.x = ((mouse.x - rect.left) / rect.width) * 2 - 1;
    this.mouseNdc.y = -(((mouse.y - rect.top) / rect.height) * 2 - 1);
  }
}
