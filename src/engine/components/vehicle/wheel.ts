import * as THREE from 'three';
import Component from '../../ecs/component';
import moveTowards from '../../../utils/move-towards';

export type WheelRollContext = {
  groundSpeed: number;
  throttle: number;
  brake: boolean;
};

export type WheelProps = {
  maxSteerAngleDeg?: number;
  isRear?: boolean;
  steerInverse?: boolean;
  radius?: number;

  freeRollAngularSpeed?: number;
  rollStopSpeed?: number;
};

export default class Wheel extends Component {
  maxSteerAngle?: number;
  isRear?: boolean;
  steerInverse?: boolean;
  radius = 0.4;

  isGrounded = false;
  currentSteerAngle = 0;
  currentRollAngle = 0;
  currentRollAngularSpeed = 0;

  freeRollAngularSpeed = 35;
  rollStopSpeed = 20;

  baseObject?: THREE.Object3D;
  steerObject?: THREE.Object3D;
  rollObject?: THREE.Object3D;

  constructor(initialData: Partial<WheelProps> = {}) {
    super();

    this.isRear = initialData.isRear;
    this.steerInverse = initialData.steerInverse;

    if (initialData.radius !== undefined) {
      this.radius = initialData.radius;
    }

    if (initialData.maxSteerAngleDeg) {
      this.maxSteerAngle = THREE.MathUtils.DEG2RAD * initialData.maxSteerAngleDeg;
    }

    if (initialData.freeRollAngularSpeed !== undefined) {
      this.freeRollAngularSpeed = initialData.freeRollAngularSpeed;
    }

    if (initialData.rollStopSpeed !== undefined) {
      this.rollStopSpeed = initialData.rollStopSpeed;
    }
  }

  protected resolveTargetAngle(steer: number) {
    if (!this.maxSteerAngle) return 0;

    return this.maxSteerAngle * steer * (this.steerInverse ? 1 : -1);
  }

  protected moveSteerAngle(targetAngle: number) {
    if (!this.maxSteerAngle) return;

    const steerSpeed = this.maxSteerAngle / 0.2;

    this.currentSteerAngle = moveTowards(this.currentSteerAngle, targetAngle, steerSpeed * this.dt);
  }

  solveRoll(ctx: WheelRollContext) {
    if (!this.rollObject || this.radius <= 0) return;

    let targetAngularSpeed = 0;

    if (this.isGrounded) {
      targetAngularSpeed = ctx.groundSpeed / this.radius;
    } else if (Math.abs(ctx.throttle) > 0.01) {
      targetAngularSpeed = ctx.throttle * this.freeRollAngularSpeed;
    }

    if (ctx.brake) {
      targetAngularSpeed = 0;
    }

    this.currentRollAngularSpeed = moveTowards(
      this.currentRollAngularSpeed,
      targetAngularSpeed,
      this.rollStopSpeed * this.dt,
    );

    this.currentRollAngle += this.currentRollAngularSpeed * this.dt;

    this.rollObject.rotation.x = this.currentRollAngle;
  }

  solveSteer(steer: number): void {
    if (!this.maxSteerAngle || !this.steerObject) return;

    const targetAngle = this.resolveTargetAngle(steer);

    this.moveSteerAngle(targetAngle);

    this.steerObject.rotation.y = this.currentSteerAngle;
  }
}
