import * as THREE from "three";
import SimpleScene from "./simple.scene";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import PixelatePass from "../render/PixelatePass";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import RenderPixelatedPass from "../render/RenderPixelatedPass";

export default class PixelScene extends SimpleScene {
    protected init(): void {
        super.init();

        let screenResolution = new THREE.Vector2(
            window.innerWidth,
            window.innerHeight,
        );
        let renderResolution = screenResolution.clone().divideScalar(4);
        renderResolution.x |= 0;
        renderResolution.y |= 0;

        this.composer = new EffectComposer(this.engine.renderer);

        const pixelPass = new RenderPixelatedPass(renderResolution, null, this.camera);
        const bloomPass = new UnrealBloomPass(screenResolution, 0.4, 0.1, 0.9);
        const pixelatePass = new PixelatePass(renderResolution);

        this.composer.addPass(pixelPass);
        this.composer.addPass(bloomPass);
        this.composer.addPass(pixelatePass);

        pixelPass.scene = this;
    }

    render() {
        this.composer?.render();
    }
}
