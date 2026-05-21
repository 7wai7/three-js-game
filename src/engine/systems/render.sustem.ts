import * as THREE from "three";
import System from "./system";

export default class RenderSystem extends System {
    readonly renderer: THREE.WebGLRenderer;
    readonly scene: THREE.Scene<THREE.Object3DEventMap>;
    readonly camera: THREE.Camera;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
        super();
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }
}