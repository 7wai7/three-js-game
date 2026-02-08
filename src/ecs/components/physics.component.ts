import type {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
} from "@dimforge/rapier3d";
import TransformComponent from "./transform.component";
import MonoBehaviourComponent from "./monoBehaviour.component";

export default class PhysicsComponent extends MonoBehaviourComponent {
  rb!: RigidBody;
  collider!: Collider;

  private transformComponent?: TransformComponent;
  private rbDesc: RigidBodyDesc;
  private colliderDesc: ColliderDesc;

  constructor(rbDesc: RigidBodyDesc, colliderDesc: ColliderDesc) {
    super();
    this.rbDesc = rbDesc;
    this.colliderDesc = colliderDesc;
  }

  init() {
    this.rb = this.engine.physicsWorld.createRigidBody(this.rbDesc);
    this.collider = this.engine.physicsWorld.createCollider(
      this.colliderDesc,
      this.rb,
    );
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

  onDestroy() {
    if (this.collider) {
      this.engine.physicsWorld.removeCollider(this.collider, true);
    }
    if (this.rb) {
      this.engine.physicsWorld.removeRigidBody(this.rb);
    }
  }
}
