import * as THREE from 'three';
import AimAtTarget from '../../components/transform/aim-at-target';
import System from '../system';

const EPSILON = 1e-8;

export default class AimAtTargetSystem extends System {
  private readonly axisLocal = new THREE.Vector3();
  private readonly axisWorld = new THREE.Vector3();
  private readonly forwardWorld = new THREE.Vector3();
  private readonly objectPosition = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly targetDirection = new THREE.Vector3();
  private readonly projectedForward = new THREE.Vector3();
  private readonly projectedTarget = new THREE.Vector3();
  private readonly cross = new THREE.Vector3();

  update(): void {
    for (const [, aim] of this.world.query(AimAtTarget)) {
      if (!aim.enabled || (!aim.targetObject && !aim.targetPosition)) {
        continue;
      }

      this.rotateObjectToTarget(aim);
    }
  }

  private rotateObjectToTarget(aim: AimAtTarget) {
    this.axisLocal.copy(aim.rotationAxis);
    if (this.axisLocal.lengthSq() <= EPSILON) {
      return;
    }

    const object = aim.gameObject;

    this.axisLocal.normalize();

    object.updateWorldMatrix(true, false);
    aim.targetObject?.updateWorldMatrix(true, false);

    object.getWorldPosition(this.objectPosition);
    if (aim.targetObject) aim.targetObject.getWorldPosition(this.targetPosition);
    else if (aim.targetPosition) this.targetPosition.copy(aim.targetPosition);

    this.targetDirection.subVectors(this.targetPosition, this.objectPosition);
    if (this.targetDirection.lengthSq() <= EPSILON) {
      return;
    }

    this.axisWorld.copy(this.axisLocal).transformDirection(object.matrixWorld);
    this.forwardWorld.copy(aim.forwardAxis).normalize().transformDirection(object.matrixWorld);
    this.targetDirection.normalize();

    this.projectOnPlane(this.projectedForward, this.forwardWorld, this.axisWorld);
    this.projectOnPlane(this.projectedTarget, this.targetDirection, this.axisWorld);

    if (this.projectedForward.lengthSq() <= EPSILON || this.projectedTarget.lengthSq() <= EPSILON) {
      return;
    }

    this.projectedForward.normalize();
    this.projectedTarget.normalize();

    const angle = Math.atan2(
      this.cross.copy(this.projectedForward).cross(this.projectedTarget).dot(this.axisWorld),
      this.projectedForward.dot(this.projectedTarget),
    );

    const delta = this.resolveDelta(angle, aim);

    if (Math.abs(delta) <= EPSILON) {
      return;
    }

    object.rotateOnAxis(this.axisLocal, delta);
    aim.currentAngle += delta;
  }

  private projectOnPlane(target: THREE.Vector3, vector: THREE.Vector3, planeNormal: THREE.Vector3) {
    target.copy(vector).addScaledVector(planeNormal, -vector.dot(planeNormal));
  }

  private resolveDelta(angle: number, aim: AimAtTarget) {
    const targetAngle = this.clampAngle(aim.currentAngle + angle, aim.minAngle, aim.maxAngle);
    const delta = targetAngle - aim.currentAngle;

    if (aim.maxAngularSpeed === undefined) {
      return delta;
    }

    const maxDelta = Math.max(aim.maxAngularSpeed, 0) * this.dt;
    return THREE.MathUtils.clamp(delta, -maxDelta, maxDelta);
  }

  private clampAngle(angle: number, minAngle?: number, maxAngle?: number) {
    return THREE.MathUtils.clamp(
      angle,
      minAngle ?? Number.NEGATIVE_INFINITY,
      maxAngle ?? Number.POSITIVE_INFINITY,
    );
  }
}
