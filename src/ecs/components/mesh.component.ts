import * as THREE from "three";
import TransformComponent from "./transform.component";
import { gltfLoader } from "../../main";
import MonoBehaviourComponent from "./monoBehaviour.component";
import type { Point } from "../ecs.types";

export default class MeshComponent extends MonoBehaviourComponent {
  mesh?: THREE.Object3D;
  visualOffset: Point = { x: 0, y: 0, z: 0 };

  private meshPath?: string;
  private transformComp!: TransformComponent;
  private meshOrPath: string | THREE.Object3D;

  constructor(meshOrPath: string | THREE.Object3D) {
    super();
    this.meshOrPath = meshOrPath;
  }

  async init() {
    super.init();
    if (this.meshOrPath instanceof THREE.Object3D) {
      this.mesh = this.meshOrPath;
      this.meshPath = "";
      this.scene.add(this.mesh);
    } else {
      this.meshPath = this.meshOrPath;
    }

    if (!this.mesh) await this.loadMesh(this.meshPath);

    this.transformComp = this.ecsService.getComponent(
      this.entityId,
      TransformComponent,
    )!;
    if (!this.transformComp)
      throw new Error(
        `MeshComponent requires a TransformComponent on the same entity (entityId: ${this.entityId})`,
      );
  }

  async loadMesh(meshPath: string) {
    const base = await gltfLoader.loadAsync(meshPath);
    const model = base.scene;
    this.scene.add(model);
    this.mesh = model;
  }

  async postUpdate() {
    if (!this.mesh) return;
    this.mesh.position.set(
      this.transformComp.position.x + this.visualOffset.x,
      this.transformComp.position.y + this.visualOffset.y,
      this.transformComp.position.z + this.visualOffset.z,
    );
    this.mesh.rotation.set(
      this.transformComp.rotation.x,
      this.transformComp.rotation.y,
      this.transformComp.rotation.z,
    );
    this.mesh.scale.set(
      this.transformComp.scale.x,
      this.transformComp.scale.y,
      this.transformComp.scale.z,
    );
  }
}
