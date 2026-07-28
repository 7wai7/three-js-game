import * as THREE from 'three';
import Component from '../../../ecs/component';

export const DEFAULT_PROJECTILE_MODEL_PATH = 'src/assets/Weapons/Bullet.glb';

export type ProjectileEmitterProps = {
  projectileModelPath?: string;
  speed?: number;
  gravity?: THREE.Vector3Like;
  drag?: number;
  lifetime?: number;
  shootPoints?: THREE.Object3D[];
};

export default class ProjectileEmitter extends Component {
  projectileModelPath = DEFAULT_PROJECTILE_MODEL_PATH;
  speed = 80;
  gravity = new THREE.Vector3(0, -9.81, 0);
  drag = 0.05;
  lifetime = 5;
  shootPoints: THREE.Object3D[] = [];
  nextShootPointIndex = 0;

  constructor(props: ProjectileEmitterProps = {}) {
    super();

    if (props.projectileModelPath !== undefined) {
      this.projectileModelPath = props.projectileModelPath;
    }

    if (props.speed !== undefined) {
      this.speed = props.speed;
    }

    if (props.gravity) {
      this.gravity.copy(props.gravity);
    }

    if (props.drag !== undefined) {
      this.drag = props.drag;
    }

    if (props.lifetime !== undefined) {
      this.lifetime = props.lifetime;
    }

    if (props.shootPoints) {
      this.shootPoints = [...props.shootPoints];
    }
  }

  getShootPoint(index = this.nextShootPointIndex) {
    if (this.shootPoints.length === 0) {
      return;
    }

    return this.shootPoints[index % this.shootPoints.length];
  }

  nextShootPoint() {
    if (this.shootPoints.length === 0) {
      return;
    }

    const shootPoint = this.getShootPoint(this.nextShootPointIndex);
    this.nextShootPointIndex = (this.nextShootPointIndex + 1) % this.shootPoints.length;
    return shootPoint;
  }
}
