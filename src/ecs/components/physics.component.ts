import type {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
} from "@dimforge/rapier3d";
import { physicsWorld } from "../../physics/world";
import TransformComponent from "./transform.component";
import MonoBehaviourComponent from "./monoBehaviour.component";

export default class PhysicsComponent extends MonoBehaviourComponent {
  readonly rb: RigidBody;
  readonly collider: Collider;

  private transformComponent?: TransformComponent;

  constructor(rbDesc: RigidBodyDesc, colliderDesc: ColliderDesc) {
    super();
    this.rb = physicsWorld.createRigidBody(rbDesc);
    this.collider = physicsWorld.createCollider(colliderDesc, this.rb);
  }

  init() {
    super.init();
    this.transformComponent = this.ecsService.getComponent(
      this.entityId,
      TransformComponent,
    );
  }

  update(): void {
    if (!this.transformComponent) return;
    const position = this.rb.translation();
    const rotation = this.rb.rotation();
    const scale = this.transformComponent.scale;
    this.transformComponent.position = {
      x: position.x,
      y: position.y,
      z: position.z,
    };
    this.transformComponent.rotation = {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
    };
    this.transformComponent.scale = scale;
  }
}
