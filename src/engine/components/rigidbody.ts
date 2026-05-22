import type {
  RigidBody,
} from "@dimforge/rapier3d";

import Component from "../ecs/component";

export default class RigidBodyComponent extends Component {
  rigidBody: RigidBody;

  constructor(
    rigidBody: RigidBody,
  ) {
    super();
    this.rigidBody = rigidBody;
  }
}
