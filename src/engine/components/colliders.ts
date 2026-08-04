import type RAPIER from '@dimforge/rapier3d';
import Component from '../ecs/component';

export default class Colliders extends Component {
  colliders: RAPIER.Collider[];

  constructor(colliders: RAPIER.Collider[]) {
    super();
    this.colliders = [...colliders];
  }

  get primary() {
    return this.colliders[0];
  }

  dispose() {
    for (const collider of this.colliders) {
      if (!collider.isValid()) {
        continue;
      }

      this.physicsWorld.removeCollider(collider, true);
    }
  }
}
