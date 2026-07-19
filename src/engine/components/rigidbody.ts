import type RAPIER from "@dimforge/rapier3d";
import Component from "../ecs/component";

export default class RigidBody extends Component {
  rigidBody: RAPIER.RigidBody;

  constructor(
    rigidBody: RAPIER.RigidBody,
  ) {
    super();
    this.rigidBody = rigidBody;
  }

  dispose() {
    const rigidBody = this.rigidBody;

    if (!rigidBody.isValid()) {
      return;
    }

    this.physicsWorld.removeRigidBody(rigidBody);
  }
}
