import * as THREE from 'three';
import RigidBody from '../components/rigidbody';
import System from './system';

export default class PhysicsSyncSystem extends System {
  private readonly worldPosition = new THREE.Vector3();
  private readonly worldQuaternion = new THREE.Quaternion();
  private readonly parentWorldQuaternion = new THREE.Quaternion();

  preRender(): void {
    const entities = this.world.entitiesWith(RigidBody);

    for (const entity of entities) {
      const rigidbody = this.world.getComponent(entity, RigidBody)!;

      const rb = rigidbody.rigidBody;

      const pos = rb.translation();
      const rot = rb.rotation();

      this.worldPosition.set(pos.x, pos.y, pos.z);
      this.worldQuaternion.set(rot.x, rot.y, rot.z, rot.w);

      this.applyWorldTransform(rigidbody.gameObject, this.worldPosition, this.worldQuaternion);
    }
  }

  private applyWorldTransform(
    object: THREE.Object3D,
    worldPosition: THREE.Vector3,
    worldQuaternion: THREE.Quaternion,
  ) {
    const parent = object.parent;

    if (!parent) {
      object.position.copy(worldPosition);
      object.quaternion.copy(worldQuaternion);
      return;
    }

    parent.updateMatrixWorld(true);

    object.position.copy(worldPosition);
    parent.worldToLocal(object.position);

    parent.getWorldQuaternion(this.parentWorldQuaternion);
    object.quaternion.copy(this.parentWorldQuaternion).invert().multiply(worldQuaternion);
  }
}
