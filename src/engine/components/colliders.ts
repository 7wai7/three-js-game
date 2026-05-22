import type {
  Collider,
} from "@dimforge/rapier3d";

import Component from "../ecs/component";
export default class CollidersComponent extends Component {
  colliders: Collider[];

  constructor(
    colliders: Collider[],
  ) {
    super();
    this.colliders = colliders;
  }
}
