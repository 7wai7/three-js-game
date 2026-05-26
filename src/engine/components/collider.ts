import type {
  Collider,
} from "@dimforge/rapier3d";
import Component from "../ecs/component";

export default class ColliderComponent extends Component {
  collider: Collider;

  constructor(
    collider: Collider,
  ) {
    super();
    this.collider = collider;
  }
}
