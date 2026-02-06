import * as THREE from "three"
import MonoBehaviourComponent from "./monoBehaviour.component";
import { gltfLoader } from "../../main";
import { ecsService } from "../ecs.service";
import MeshComponent from "./mesh.component";

export default class AnimationComponent extends MonoBehaviourComponent {
    private mixer?: THREE.AnimationMixer;
    private actions: Record<string, THREE.AnimationAction> = {};
    private currentAction: THREE.AnimationAction | null = null;
    private clock = new THREE.Clock();

    private pendingLoads: [string, string][] = []; // черга
    private pendingPlay?: string;

    update() {
        this.tryInitMixer();
        if (!this.mixer) return;
        this.mixer.update(this.clock.getDelta());
    }

    async loadAnimation(name: string, url: string) {
        if (!this.mixer) {
            this.pendingLoads.push([name, url]);
            return;
        }

        const gltf = await gltfLoader.loadAsync(url);

        if (gltf.animations.length === 0) {
            console.error(`No animations in ${url}`);
            return;
        }

        const clip = gltf.animations[0];
        this.actions[name] = this.mixer.clipAction(clip);

        if (this.pendingPlay === name) {
            this.playAnimation(name);
            this.pendingPlay = undefined;
        }
    }

    playAnimation(name: string) {
        if (!this.actions[name]) {
            this.pendingPlay = name;
            return;
        }

        const next = this.actions[name];
        if (!next || next === this.currentAction) return;

        next.reset().fadeIn(0.2).play();
        this.currentAction?.fadeOut(0.2);

        this.currentAction = next;
    }

    private async tryInitMixer() {
        if (this.mixer) return;

        const meshComp = ecsService.getComponent(this.entityId, MeshComponent);
        if (!meshComp?.mesh) return;

        this.mixer = new THREE.AnimationMixer(meshComp.mesh);

        // догружаємо все з черги
        const queue = [...this.pendingLoads];
        this.pendingLoads.length = 0;

        for (const [name, url] of queue) {
            await this.loadAnimation(name, url);
        }
    }
}