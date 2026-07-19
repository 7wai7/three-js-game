import type RAPIER from '@dimforge/rapier3d';
import Component from '../ecs/component';

export default class Collider extends Component {
  collider: RAPIER.Collider;

  constructor(collider: RAPIER.Collider) {
    super();
    this.collider = collider;
  }

  dispose() {
    const collider = this.collider;

    if (!collider.isValid()) {
      return;
    }

    this.physicsWorld.removeCollider(collider, true);
  }
}
