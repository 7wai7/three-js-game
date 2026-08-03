import * as THREE from 'three';
import Component from '../../../ecs/component';

export type BallisticProjectileProps = {
  velocity: THREE.Vector3;
  gravityScale?: number;
  drag?: number;
  lifetime?: number;
};

export default class BallisticProjectile extends Component {
  velocity: THREE.Vector3;
  gravityScale = 1;
  drag = 0;
  lifetime = 5;
  age = 0;

  constructor(props: BallisticProjectileProps) {
    super();

    this.velocity = props.velocity.clone();

    if (props.gravityScale) {
      this.gravityScale = props.gravityScale;
    }

    if (props.drag !== undefined) {
      this.drag = props.drag;
    }

    if (props.lifetime !== undefined) {
      this.lifetime = props.lifetime;
    }
  }
}
