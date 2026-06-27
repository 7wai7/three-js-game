import type RAPIER from "@dimforge/rapier3d";
import Component from "../ecs/component";

export default class MultipleColliders extends Component {
  colliders: RAPIER.Collider[];

  constructor(
    colliders: RAPIER.Collider[],
  ) {
    super();
    this.colliders = colliders;
  }
}
