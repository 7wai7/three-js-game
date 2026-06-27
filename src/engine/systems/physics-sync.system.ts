import * as THREE from "three";
import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import System from "./system";

const worldPos = new THREE.Vector3();
const worldQuat = new THREE.Quaternion();
const parentWorldQuat = new THREE.Quaternion();

export default class PhysicsSyncSystem extends System {
    preRender(): void {
        const entities = this.world.entitiesWith(
            Object3DComponent,
            RigidBodyComponent,
        );

        for (const entity of entities) {
            const object = this.world.getComponent(
                entity,
                Object3DComponent,
            )!.object as THREE.Object3D;

            const rb = this.world.getComponent(
                entity,
                RigidBodyComponent,
            )!.rigidBody;

            const pos = rb.translation();
            const rot = rb.rotation();

            worldPos.set(pos.x, pos.y, pos.z);
            worldQuat.set(rot.x, rot.y, rot.z, rot.w);

            if (object.parent) {
                object.parent.updateWorldMatrix(true, false);

                object.parent.worldToLocal(worldPos);
                object.position.copy(worldPos);

                object.parent.getWorldQuaternion(parentWorldQuat);
                object.quaternion.copy(parentWorldQuat.invert().multiply(worldQuat));
            } else {
                object.position.copy(worldPos);
                object.quaternion.copy(worldQuat);
            }
        }
    }
}