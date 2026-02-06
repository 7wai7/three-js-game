import * as THREE from "three"
import TransformComponent from "./transform.component";
import { ecsService } from "../ecs.service";
import { gltfLoader } from "../../main";
import { scene } from "../../scene/initScene";
import MonoBehaviourComponent from "./monoBehaviour.component";

export default class MeshComponent extends MonoBehaviourComponent {
    mesh?: THREE.Object3D;

    private meshPath: string;
    private transformComp!: TransformComponent;

    constructor(meshPath: string) {
        super();
        this.meshPath = meshPath;
    }

    async init() {
        await this.loadMesh(this.meshPath);
        this.transformComp = ecsService.getComponent(this.entityId, TransformComponent)!;
        if (!this.transformComp)
            throw new Error(`MeshComponent requires a TransformComponent on the same entity (entityId: ${this.entityId})`)
    }

    async loadMesh(meshPath: string) {
        const base = await gltfLoader.loadAsync(meshPath);
        const model = base.scene;
        scene.add(model);
        this.mesh = model
    }

    async update() {
        if (!this.mesh) return;
        this.mesh.position.set(this.transformComp.position.x, this.transformComp.position.y, this.transformComp.position.z);
        this.mesh.rotation.set(this.transformComp.rotation.x, this.transformComp.rotation.y, this.transformComp.rotation.z);
        this.mesh.scale.set(this.transformComp.scale.x, this.transformComp.scale.y, this.transformComp.scale.z);
    }
}
