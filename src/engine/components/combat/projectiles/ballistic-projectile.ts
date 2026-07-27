import * as THREE from 'three';
import Component from '../../../ecs/component';

export type BallisticProjectileProps = {
  velocity: THREE.Vector3;
  gravity?: THREE.Vector3;
  drag?: number;
  lifetime?: number;
};

export default class BallisticProjectile extends Component {
  velocity: THREE.Vector3;
  gravity = new THREE.Vector3(0, -9.81, 0);
  drag = 0;
  lifetime = 5;
  age = 0;

  constructor(props: BallisticProjectileProps) {
    super();

    this.velocity = props.velocity.clone();

    if (props.gravity) {
      this.gravity.copy(props.gravity);
    }

    if (props.drag !== undefined) {
      this.drag = props.drag;
    }

    if (props.lifetime !== undefined) {
      this.lifetime = props.lifetime;
    }
  }
}
